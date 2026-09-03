import { describe, it, expect } from "vitest";
import { api, registerUser, createCompany } from "./helpers";

const getCredits = async (
  accessToken: string,
  companyId: string,
): Promise<number> => {
  const res = await api
    .get(`/api/v1/companies/${companyId}`)
    .set("Authorization", `Bearer ${accessToken}`);
  return res.body.data.credits as number;
};

describe("Payments (SSLCommerz)", () => {
  it("lists packages and initiates a payment in mock mode", async () => {
    const recruiter = await registerUser("RECRUITER");
    const company = await createCompany(recruiter);

    const packages = await api.get("/api/v1/payments/packages");
    expect(packages.status).toBe(200);
    expect(packages.body.data.length).toBeGreaterThan(0);
    const pkg = packages.body.data[0];

    const initiate = await api
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ packageId: pkg.id, companyId: company.id });
    expect(initiate.status).toBe(201);
    expect(initiate.body.data.payment.transactionId).toBeTruthy();
    expect(initiate.body.data.payment.status).toBe("PENDING");
    expect(initiate.body.data.isMock).toBe(true);
  });

  it("marks a transaction PAID, credits the company, and is idempotent", async () => {
    const recruiter = await registerUser("RECRUITER");
    const company = await createCompany(recruiter);
    const before = await getCredits(recruiter.accessToken, company.id);

    const packages = await api.get("/api/v1/payments/packages");
    const pkg = packages.body.data[0];
    const initiate = await api
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ packageId: pkg.id, companyId: company.id });
    const tx = initiate.body.data.payment.transactionId;

    const success = await api
      .post("/api/v1/payments/success")
      .send({ tran_id: tx });
    expect(success.status).toBe(200);
    expect(success.body.data.credited).toBe(true);

    const after = await getCredits(recruiter.accessToken, company.id);
    expect(after).toBe(before + pkg.credits);

    // A repeated success callback must NOT double-credit.
    const again = await api
      .post("/api/v1/payments/success")
      .send({ tran_id: tx });
    expect(again.status).toBe(200);
    const afterAgain = await getCredits(recruiter.accessToken, company.id);
    expect(afterAgain).toBe(before + pkg.credits);

    // The payment record is now PAID.
    const payment = await api
      .get(`/api/v1/payments/${initiate.body.data.payment.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(payment.body.data.status).toBe("PAID");
  });

  it("handles failed and cancelled callbacks without granting credits", async () => {
    const recruiter = await registerUser("RECRUITER");
    const company = await createCompany(recruiter);
    const before = await getCredits(recruiter.accessToken, company.id);

    const packages = await api.get("/api/v1/payments/packages");
    const pkg = packages.body.data[0];
    const initiate = await api
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ packageId: pkg.id, companyId: company.id });
    const tx = initiate.body.data.payment.transactionId;

    const fail = await api.post("/api/v1/payments/fail").send({ tran_id: tx });
    expect(fail.status).toBe(200);
    expect(fail.body.data.status).toBe("FAILED");

    const afterFail = await getCredits(recruiter.accessToken, company.id);
    expect(afterFail).toBe(before);

    // A failed transaction must never be marked PAID later.
    const successTries = await api
      .post("/api/v1/payments/success")
      .send({ tran_id: tx });
    expect(successTries.status).toBe(409);

    // Cancel path.
    const initiate2 = await api
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ packageId: pkg.id, companyId: company.id });
    const tx2 = initiate2.body.data.payment.transactionId;
    const cancel = await api
      .post("/api/v1/payments/cancel")
      .send({ tran_id: tx2 });
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe("CANCELLED");
  });

  it("does not expose payment secrets and lists payments", async () => {
    const recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    const list = await api
      .get("/api/v1/payments")
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
    for (const payment of list.body.data) {
      expect(payment.transactionId).toBeTruthy();
      expect(JSON.stringify(payment)).not.toContain("store_passwd");
      expect(JSON.stringify(payment)).not.toContain(
        process.env.SSLCOMMERZ_STORE_PASSWORD ?? "no-password-set",
      );
    }
  });
});
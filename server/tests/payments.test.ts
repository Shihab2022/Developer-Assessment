import { describe, it, expect } from "vitest";
import { api, registerUser, createCompany } from "./helpers";

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
    expect(initiate.body.data.isMock).toBe(true);
    globalThis.__testTransactionId = initiate.body.data.payment.transactionId;
    globalThis.__testPaymentId = initiate.body.data.payment.id;
    globalThis.__testCompanyCredits = company.credits;
  });

  it("verifies a transaction and grants credits (mock success path)", async () => {
    const transactionId = globalThis.__testTransactionId as string;
    const recruiter = await registerUser("RECRUITER");
    const company = await createCompany(recruiter);
    const before = company.credits as number;

    // Re-initiate tied to the recruiter's company so credits go to a known company
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

    const after = await api
      .get(`/api/v1/companies/${company.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(after.body.data.credits).toBe(before + pkg.credits);

    // Idempotency: a second success callback must not double-credit
    const again = await api
      .post("/api/v1/payments/success")
      .send({ tran_id: tx });
    expect(again.status).toBe(200);
    const afterAgain = await api
      .get(`/api/v1/companies/${company.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(afterAgain.body.data.credits).toBe(before + pkg.credits);
    expect(transactionId).toBeTruthy();
  });

  it("handles a failed callback without granting credits", async () => {
    const recruiter = await registerUser("RECRUITER");
    const company = await createCompany(recruiter);
    const before = company.credits as number;

    const packages = await api.get("/api/v1/payments/packages");
    const pkg = packages.body.data[0];
    const initiate = await api
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ packageId: pkg.id, companyId: company.id });
    const tx = initiate.body.data.payment.transactionId;

    const fail = await api.post("/api/v1/payments/fail").send({ tran_id: tx });
    expect(fail.status).toBe(200);

    const after = await api
      .get(`/api/v1/companies/${company.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(after.body.data.credits).toBe(before);
  });

  it("does not expose payment secrets and lists payments", async () => {
    const recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    const list = await api
      .get("/api/v1/payments")
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(list.status).toBe(200);
    for (const payment of list.body.data) {
      expect(payment.transactionId).toBeTruthy();
      expect(JSON.stringify(payment)).not.toContain(
        process.env.SSLCOMMERZ_STORE_PASSWORD ?? "",
      );
    }
  });
});
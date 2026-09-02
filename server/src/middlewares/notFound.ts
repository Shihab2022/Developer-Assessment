import { Request, Response } from "express";
// import { BookingPayload, NotificationService } from "../services/notification.service";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    date: new Date(),
  });
};

export const testingRoute = async (req: Request, res: Response) => {
  //   const mockBooking: BookingPayload = {
  //     id: "booking_12345",
  //     scheduledDate: new Date(),
  //     scheduledTime: "10:00 AM - 12:00 PM",
  //     customerAddress: "123 Main St, Dhaka",
  //     totalPrice: 566,
  //     customer: {
  //       email: "shihabuddindevelopper@gmail.com", // Set your real test recipient here
  //       name: "John Doe",
  //     },
  //     technician: {
  //       user: {
  //         email: "tech@example.com",
  //         name: "Jane Smith",
  //       },
  //     },
  //     service: {
  //       title: "AC Maintenance & Repair",
  //     },
  //   };

  //   await NotificationService.sendPaymentSuccess({
  //     id: "pay_34343",
  //     amount: 566,
  //     transactionId: "txn_34343",
  //     booking: mockBooking,
  //   });
  res.send({
    message: `Hi Guys, Welcome to FixItNow Server !`,
  });
};

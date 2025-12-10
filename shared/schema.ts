import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // 'student' or 'admin'
});

export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'torno' or 'modelado'
  startTime: timestamp("start_time").notNull(),
  capacity: integer("capacity").notNull(), // 7 for torno, 3 for modelado
  enrolled: integer("enrolled").notNull().default(0),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  classId: varchar("class_id").notNull().references(() => classes.id),
  status: text("status").notNull().default("active"), // 'active', 'cancelled', 'recovery'
  bookedAt: timestamp("booked_at").notNull().default(sql`now()`),
  cancelledAt: timestamp("cancelled_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  enrolled: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookedAt: true,
  cancelledAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

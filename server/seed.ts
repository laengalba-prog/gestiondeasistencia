import { storage } from "./storage";

async function seed() {
  console.log("Starting database seed...");

  // Create test users
  console.log("Creating users...");
  
  const admin = await storage.createUser({
    name: "Admin User",
    email: "admin@laengalba.com",
    password: "$2a$10$example", // This should be hashed in production
    role: "admin",
  });

  const student1 = await storage.createUser({
    name: "María García",
    email: "maria@example.com",
    password: "$2a$10$example",
    role: "student",
  });

  const student2 = await storage.createUser({
    name: "Juan Pérez",
    email: "juan@example.com",
    password: "$2a$10$example",
    role: "student",
  });

  console.log("Users created:", { admin, student1, student2 });

  // Create classes for the next 2 weeks
  console.log("Creating classes...");
  
  const now = new Date();
  const classes = [];

  // Days of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const daysToSchedule = [1, 2, 3, 4, 5]; // Monday to Friday

  for (let week = 0; week < 2; week++) {
    for (const day of daysToSchedule) {
      const classDate = new Date(now);
      classDate.setDate(now.getDate() + ((day - now.getDay() + 7) % 7) + (week * 7));
      
      // Morning torno class at 10:00
      const morningTorno = new Date(classDate);
      morningTorno.setHours(10, 0, 0, 0);
      
      const morningClass = await storage.createClass({
        type: "torno",
        startTime: morningTorno,
        capacity: 7,
      });
      classes.push(morningClass);

      // Evening modelado class at 19:00
      const eveningModelado = new Date(classDate);
      eveningModelado.setHours(19, 0, 0, 0);
      
      const eveningClass = await storage.createClass({
        type: "modelado",
        startTime: eveningModelado,
        capacity: 3,
      });
      classes.push(eveningClass);
    }
  }

  console.log(`Created ${classes.length} classes`);
  console.log("Seed completed successfully!");
}

seed().catch(console.error);

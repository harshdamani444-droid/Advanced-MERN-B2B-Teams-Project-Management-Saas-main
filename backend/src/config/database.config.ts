import mongoose from "mongoose";
import dns from "dns";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { config } from "./app.config";
import RoleModel from "../models/roles-permission.model";
import { RolePermissions } from "../utils/role-permission";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {}

const autoSeedRolesIfNeeded = async () => {
  try {
    const count = await RoleModel.countDocuments();
    if (count === 0) {
      console.log("No roles found in database. Auto-seeding initial roles...");
      for (const roleName in RolePermissions) {
        const role = roleName as keyof typeof RolePermissions;
        const permissions = RolePermissions[role];
        await RoleModel.create({
          name: role,
          permissions: permissions,
        });
        console.log(`Role ${role} auto-seeded.`);
      }
      console.log("Auto-seeding completed.");
    }
  } catch (err) {
    console.error("Error during auto-seeding roles:", err);
  }
};

const connectDatabase = async () => {
  try {
    if (config.MONGO_URI && !config.MONGO_URI.includes("127.0.0.1") && !config.MONGO_URI.includes("localhost")) {
      try {
        await mongoose.connect(config.MONGO_URI);
        console.log("Connected to Mongo database");
        await autoSeedRolesIfNeeded();
        return;
      } catch (atlasErr: any) {
        console.log("Atlas connection failed (" + (atlasErr?.message || atlasErr) + "). Falling back to local in-memory MongoDB server...");
      }
    }

    console.log("Starting in-memory MongoDB ReplicaSet server...");
    const replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, name: "rs0" },
    });
    const uri = replSet.getUri();
    await mongoose.connect(uri);
    console.log("Connected to in-memory Mongo database");
    await autoSeedRolesIfNeeded();
  } catch (error) {
    console.log("Error connecting to Mongo database:", error);
    process.exit(1);
  }
};

export default connectDatabase;

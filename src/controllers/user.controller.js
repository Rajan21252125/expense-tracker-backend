import express from "express";
import axios from "axios";
const router = express.Router();

router.get("/all-users", async (req, res) => {
  try {
    const response = await axios.get("https://api.clerk.com/v1/users", {
      headers: {
        "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`,
      }
    });
    const sanitizedUsers = response.data.map((u) => ({
      id: u.id,
      email: u.email_addresses[0]?.email_address,
      firstName: u.first_name,
      lastName: u.last_name,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at
    }));

    res.json({ users: sanitizedUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch users" });
  }
});

export default router;

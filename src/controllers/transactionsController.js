import { sql } from "../config/db.js";

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;
    const { type, category, from, to, sort } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let query = sql`SELECT * FROM transactions WHERE user_id = ${userId}`;

    if (type === "income") {
      query = sql`${query} AND amount > 0`;
    }

    if (type === "expense") {
      query = sql`${query} AND amount < 0`;
    }

    if (category && category !== "All") {
      query = sql`${query} AND category = ${category}`;
    }

    if (from) {
      query = sql`${query} AND created_at >= ${from}`;
    }

    if (to) {
      query = sql`${query} AND created_at <= ${to}`;
    }

    if (sort === "asc") {
      query = sql`${query} ORDER BY created_at ASC`;
    } else {
      query = sql`${query} ORDER BY created_at DESC`;
    }

    const transactions = await query;

    res.status(200).json(transactions);
  } catch (error) {
    console.log("Error getting the transactions", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function createTransaction(req, res) {
  try {
    const { title, amount, category, user_id } = req.body;

    if (!title || !user_id || !category || amount === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log(req.body);

    const transaction = await sql`
      INSERT INTO transactions(user_id,title,amount,category)
      VALUES (${user_id},${title},${amount},${category})
      RETURNING *
    `;

    console.log(transaction);
    res.status(201).json(transaction[0]);
  } catch (error) {
    console.log("Error creating the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const result = await sql`
      DELETE FROM transactions WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.log("Error deleting the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSummaryByUserId(req, res) {
  try {
    const { userId } = req.params;
    const { category, from, to } = req.query;
    console.log("Summary filters:", { category, from, to });

    // BASE QUERY
    let whereClause = sql`user_id = ${userId}`;

    // CATEGORY FILTER
    if (category && category !== "All") {
      whereClause = sql`${whereClause} AND category = ${category}`;
    }

    // DATE RANGE FILTER
    if (from) {
      whereClause = sql`${whereClause} AND created_at >= ${from}`;
    }
    if (to) {
      whereClause = sql`${whereClause} AND created_at <= ${to}`;
    }

    // SUMMARY QUERIES USING FILTERS
    const balanceResult = await sql`
      SELECT COALESCE(SUM(amount), 0) AS balance
      FROM transactions
      WHERE ${whereClause}
    `;

    const incomeResult = await sql`
      SELECT COALESCE(SUM(amount), 0) AS income
      FROM transactions
      WHERE ${whereClause} AND amount > 0
    `;

    const expensesResult = await sql`
      SELECT COALESCE(SUM(amount), 0) AS expenses
      FROM transactions
      WHERE ${whereClause} AND amount < 0
    `;

    res.status(200).json({
      balance: balanceResult[0].balance,
      income: incomeResult[0].income,
      expenses: expensesResult[0].expenses,
    });
  } catch (error) {
    console.log("Error getting the summary", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


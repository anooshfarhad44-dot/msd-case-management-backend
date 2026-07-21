require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 MSD CMS API running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`📦 Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./utility/features.js";
import { errorMiddleware } from "./utility/utility.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import widgetRoutes from "./routes/widget.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import CTARoutes from "./routes/cta.routes.js";
import { swaggerDocs } from "./swagger/swagger.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
dotenv.config();

const app = express();
connectDB(process.env.MONGO_URI); 
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(cors({
    origin:[process.env.FRONTEND_URL, process.env.FRONTEND_URL2, process.env.ADMIN_URL, process.env.AUDIT_DASHBOARD_URL],
    credentials: true,
}));

app.get("/", (req, res) => {
    res.send("Hello World");
}); 


app.get('/widget.js', (req, res) => {
    const widgetPath = path.join(__dirname, 'public', 'widget.js'); 
    const referer = req.headers.referer || '';
    const origin = req.headers.origin || '';
    const host = req.headers.host;
    console.log(referer, origin, host);

    // Check if widget file exists
    if (!fs.existsSync(widgetPath)) {
        return res.status(404).json({
            success: false,
            message: 'Widget file not found'
        });
    }

    // Set appropriate headers for JavaScript file
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Log the request for analytics (optional)
    const siteId = req.query.id;
    console.log(siteId);
    // if (!siteId) {
    //     console.log(`Widget loaded for site: ${siteId} at ${new Date().toISOString()}`);
    // }
    

    // Send the widget file
    res.sendFile(widgetPath);
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/widget", widgetRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/cta",CTARoutes)

swaggerDocs(app);
app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
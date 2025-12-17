import ftp from "basic-ftp";
import dotenv from "dotenv";
import { Readable } from "stream";
import Blog from "../models/Blog.js";

dotenv.config();

/* ================= FTP UPLOAD ================= */
const uploadToHostinger = async (file) => {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: process.env.FTP_PORT || 21,
      secure: false,
    });

    const fileName = `blog_${Date.now()}_${file.originalname}`;
    const remoteDir = process.env.FTP_UPLOAD_DIR || "assets";

    await client.ensureDir(remoteDir);

    const stream = Readable.from(file.buffer);
    await client.uploadFrom(stream, fileName);

    client.close();

    return `${process.env.FTP_PUBLIC_URL}/${fileName}`;
  } catch (err) {
    client.close();
    throw new Error("Image upload failed");
  }
};

/* ================= CREATE BLOG ================= */
export const createBlog = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    let imageUrl = null;
    if (req.file) imageUrl = await uploadToHostinger(req.file);

    const blog = await Blog.create({
      title,
      description,
      imageUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= GET ALL BLOGS ================= */
export const getAllBlogs = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;

    page = Number(page);
    limit = Number(limit);

    const query = search
      ? { title: { $regex: search, $options: "i" } }
      : {};

    const total = await Blog.countDocuments(query);

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
};

/* ================= GET BLOG BY ID ================= */
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
    });
  }
};

/* ================= UPDATE BLOG ================= */
export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    if (req.body.title) blog.title = req.body.title;
    if (req.body.description) blog.description = req.body.description;

    if (req.file) {
      blog.imageUrl = await uploadToHostinger(req.file);
    }

    await blog.save();

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= DELETE FTP IMAGE ================= */
const deleteFromHostinger = async (imageUrl) => {
  if (!imageUrl) return;

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: process.env.FTP_PORT || 21,
      secure: false,
    });

    const fileName = imageUrl.split("/").pop();
    const remoteDir = process.env.FTP_UPLOAD_DIR || "assets";

    await client.cd(remoteDir);
    await client.remove(fileName);

    client.close();
  } catch (err) {
    client.close();
    console.error("FTP delete failed:", err.message);
  }
};

/* ================= DELETE BLOG ================= */
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    if (blog.imageUrl) await deleteFromHostinger(blog.imageUrl);

    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
    });
  }
};

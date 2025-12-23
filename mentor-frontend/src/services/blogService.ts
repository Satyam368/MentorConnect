import axios from 'axios';
import { API_BASE_URL } from '../lib/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fetch all blogs
export const getAllBlogs = async (params: { page?: number; limit?: number; category?: string; search?: string }) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/blogs`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching blogs:', error);
        throw error;
    }
};

// Create a new blog post
export const createBlog = async (blogData: any) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/blogs`, blogData, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error('Error creating blog:', error);
        throw error;
    }
};

// Upload media (if needed) - Stub for now or reuse resource upload
export const uploadMedia = async (file: File) => {
    // Implement if blog needs image upload
    return null;
};

export interface BlogPost {
    _id: string;
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    category: string;
    author: {
        name: string;
        profilePicture?: string;
        bio?: string;
        role?: string;
    };
    isActive?: boolean;
    tags?: string[];
    views: number;
    likes: string[]; // User IDs
    comments?: any[];
    publishedAt: string | Date;
    createdAt: string | Date;
}

export const blogService = {
    getAllBlogs,
    createBlog,
    uploadMedia
};

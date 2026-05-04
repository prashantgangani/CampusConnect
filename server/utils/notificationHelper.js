import Notification from '../models/Notification.js';
import Job from '../models/Job.js';
import User from '../models/User.js';

export const createUserNotification = async ({ recipientId, title, message, type = 'system', metadata = {} }) => {
  try {
    if (!recipientId || !title || !message) {
      return null;
    }

    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      metadata
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

export const createBulkUserNotifications = async (items = []) => {
  try {
    const sanitized = (Array.isArray(items) ? items : [])
      .filter((item) => item?.recipientId && item?.title && item?.message)
      .map((item) => ({
        recipient: item.recipientId,
        title: item.title,
        message: item.message,
        type: item.type || 'system',
        metadata: item.metadata || {}
      }));

    if (!sanitized.length) {
      return [];
    }

    return await Notification.insertMany(sanitized, { ordered: false });
  } catch (error) {
    console.error('Failed to create bulk notifications:', error.message);
    return [];
  }
};

export const getJobNotificationContext = async (jobId) => {
  try {
    if (!jobId) {
      return { jobTitle: 'this role', companyName: 'the company' };
    }

    const job = await Job.findById(jobId).select('title company companyName').lean();
    if (!job) {
      return { jobTitle: 'this role', companyName: 'the company' };
    }

    let companyName = job.companyName || '';

    if (!companyName && job.company) {
      const company = await User.findById(job.company).select('name companyName').lean();
      companyName = company?.companyName || company?.name || '';
    }

    return {
      jobTitle: job.title || 'this role',
      companyName: companyName || 'the company'
    };
  } catch (error) {
    console.error('Failed to build job notification context:', error.message);
    return { jobTitle: 'this role', companyName: 'the company' };
  }
};

// Simple in-memory queue service (alternative to Redis)
class QueueService {
  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    // Initialize detection queue
    this.createQueue("detection", {
      maxConcurrency: 5,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    // Initialize analytics queue
    this.createQueue("analytics", {
      maxConcurrency: 2,
      retryAttempts: 2,
      retryDelay: 2000,
    });

    this.isInitialized = true;
    console.log("✅ Queue service initialized (in-memory)");
  }

  createQueue(name, options = {}) {
    const queue = {
      name,
      jobs: [],
      processing: 0,
      maxConcurrency: options.maxConcurrency || 3,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      processor: null,
    };

    this.queues.set(name, queue);
    return queue;
  }

  async addJob(queueName, jobData, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = {
      id: this.generateJobId(),
      data: jobData,
      attempts: 0,
      maxAttempts: options.maxAttempts || queue.retryAttempts,
      delay: options.delay || 0,
      priority: options.priority || 0,
      createdAt: new Date(),
      status: "waiting",
    };

    // Insert job based on priority
    const insertIndex = queue.jobs.findIndex((j) => j.priority < job.priority);
    if (insertIndex === -1) {
      queue.jobs.push(job);
    } else {
      queue.jobs.splice(insertIndex, 0, job);
    }

    // Process queue
    this.processQueue(queueName);

    return job;
  }

  setProcessor(queueName, processorFunction) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    queue.processor = processorFunction;
  }

  async processQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue || !queue.processor) return;

    // Check if we can process more jobs
    if (queue.processing >= queue.maxConcurrency || queue.jobs.length === 0) {
      return;
    }

    // Get next job
    const jobIndex = queue.jobs.findIndex(
      (job) =>
        job.status === "waiting" &&
        (job.delay === 0 || Date.now() - job.createdAt.getTime() >= job.delay)
    );

    if (jobIndex === -1) return;

    const job = queue.jobs[jobIndex];
    job.status = "processing";
    job.startedAt = new Date();
    queue.processing++;

    try {
      // Process job
      const result = await queue.processor(job);

      // Job completed successfully
      job.status = "completed";
      job.completedAt = new Date();
      job.result = result;

      // Remove from queue
      queue.jobs.splice(jobIndex, 1);
    } catch (error) {
      // Job failed
      job.attempts++;
      job.lastError = error.message;

      if (job.attempts >= job.maxAttempts) {
        // Max attempts reached
        job.status = "failed";
        job.failedAt = new Date();

        // Remove from queue
        queue.jobs.splice(jobIndex, 1);

        console.error(
          `Job ${job.id} failed after ${job.attempts} attempts:`,
          error.message
        );
      } else {
        // Retry job
        job.status = "waiting";
        job.delay = queue.retryDelay * job.attempts; // Exponential backoff

        console.warn(
          `Job ${job.id} failed, retrying (attempt ${job.attempts}/${job.maxAttempts})`
        );
      }
    } finally {
      queue.processing--;

      // Continue processing
      setTimeout(() => this.processQueue(queueName), 10);
    }
  }

  async getQueueStats(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const stats = {
      name: queueName,
      waiting: queue.jobs.filter((j) => j.status === "waiting").length,
      processing: queue.processing,
      total: queue.jobs.length,
      maxConcurrency: queue.maxConcurrency,
    };

    return stats;
  }

  async getAllStats() {
    const stats = {};

    for (const [name] of this.queues) {
      stats[name] = await this.getQueueStats(name);
    }

    return stats;
  }

  generateJobId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async close() {
    // Wait for all jobs to complete
    const maxWaitTime = 30000; // 30 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      let hasProcessingJobs = false;

      for (const [, queue] of this.queues) {
        if (queue.processing > 0) {
          hasProcessingJobs = true;
          break;
        }
      }

      if (!hasProcessingJobs) break;

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.queues.clear();
    this.workers.clear();
    this.isInitialized = false;

    console.log("✅ Queue service closed");
  }

  // Get job by ID
  getJob(queueName, jobId) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    return queue.jobs.find((job) => job.id === jobId);
  }

  // Remove job from queue
  removeJob(queueName, jobId) {
    const queue = this.queues.get(queueName);
    if (!queue) return false;

    const jobIndex = queue.jobs.findIndex((job) => job.id === jobId);
    if (jobIndex === -1) return false;

    queue.jobs.splice(jobIndex, 1);
    return true;
  }

  // Clear all jobs in queue
  clearQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return false;

    queue.jobs = queue.jobs.filter((job) => job.status === "processing");
    return true;
  }
}

module.exports = new QueueService();

const { ServiceError } = require("./errors");

function createSubmissionGuard() {
  const pending = new Map();

  function isPending(key) {
    return pending.has(key);
  }

  function run(key, mutation) {
    if (!key || typeof mutation !== "function") {
      return Promise.reject(new ServiceError("validation", "Submission key and mutation are required"));
    }
    if (pending.has(key)) {
      return Promise.reject(new ServiceError("validation", "请勿重复提交", {
        code: "DUPLICATE_SUBMISSION"
      }));
    }

    const execution = Promise.resolve().then(mutation);
    pending.set(key, execution);
    return execution.finally(() => {
      if (pending.get(key) === execution) pending.delete(key);
    });
  }

  return Object.freeze({ isPending, run });
}

module.exports = {
  createSingleFlightGuard: createSubmissionGuard,
  createSubmissionGuard
};

import { mockDb } from "./dummyData.js";

const BASE = "http://localhost:5000/api/admin";

// Helper with graceful fallback to mock database
async function tryRequest(method, path, body, fallbackFn) {
  try {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200); // quick timeout to fallback to dummy data
    opts.signal = controller.signal;

    const res = await fetch(`${BASE}${path}`, opts);
    clearTimeout(timer);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // If backend is not reached, smoothly fallback to mock database
  }
  return fallbackFn ? fallbackFn() : null;
}

// Auth
export const adminLogin = async (email, password) => {
  return tryRequest("POST", "/login", { email, password }, () => {
    // Dummy login always succeeds with rich profile
    const inst = mockDb.getInstitution();
    return {
      admin: {
        id: "admin-1",
        name: "Dr. Arvind Subramanian",
        email: email || "principal@dpsrkpuram.edu.in",
        role: "Institution Administrator",
        institutionId: inst.id,
      },
      institution: inst,
    };
  });
};

// Institution
export const getInstitution = async (id) => {
  return tryRequest("GET", `/institution/${id}`, undefined, () => ({
    institution: mockDb.getInstitution(),
  }));
};

export const updateInstitution = async (id, data) => {
  return tryRequest("PUT", `/institution/${id}`, data, () => ({
    institution: mockDb.updateInstitution(data),
  }));
};

// Teachers
export const getTeachers = async (institutionId) => {
  return tryRequest("GET", `/teachers?institutionId=${institutionId}`, undefined, () => ({
    teachers: mockDb.getTeachers(),
  }));
};

export const createTeacher = async (data) => {
  return tryRequest("POST", "/teachers", data, () => ({
    teacher: mockDb.createTeacher(data),
  }));
};

export const updateTeacher = async (id, data) => {
  return tryRequest("PUT", `/teachers/${id}`, data, () => ({
    teacher: mockDb.updateTeacher(id, data),
  }));
};

export const deleteTeacher = async (id) => {
  return tryRequest("DELETE", `/teachers/${id}`, undefined, () => mockDb.deleteTeacher(id));
};

export const assignTeacherClass = async (id, data) => {
  return tryRequest("POST", `/teachers/${id}/assign`, data, () => mockDb.assignTeacherClass(id, data.classId, data.subject));
};

export const unassignTeacherClass = async (id, data) => {
  return tryRequest("DELETE", `/teachers/${id}/assign`, data, () => mockDb.unassignTeacherClass(id, data.classId));
};

// Classes
export const getClasses = async (institutionId) => {
  return tryRequest("GET", `/classes?institutionId=${institutionId}`, undefined, () => ({
    classes: mockDb.getClasses(),
  }));
};

export const createClass = async (data) => {
  return tryRequest("POST", "/classes", data, () => ({
    class: mockDb.createClass(data),
  }));
};

export const deleteClass = async (id) => {
  return tryRequest("DELETE", `/classes/${id}`, undefined, () => mockDb.deleteClass(id));
};

// Students
export const getStudents = async (institutionId, classId) => {
  return tryRequest("GET", `/students?institutionId=${institutionId}${classId ? `&classId=${classId}` : ""}`, undefined, () => ({
    students: mockDb.getStudents(classId),
  }));
};

export const createStudent = async (data) => {
  return tryRequest("POST", "/students", data, () => ({
    student: mockDb.createStudent(data),
  }));
};

export const bulkImportStudents = async (data) => {
  return tryRequest("POST", "/students/bulk", data, () => {
    const res = mockDb.bulkImportStudents(data.students || [], data.classId);
    return { success: true, count: res.count, students: res.students };
  });
};

export const updateStudent = async (id, data) => {
  return tryRequest("PUT", `/students/${id}`, data, () => ({
    student: mockDb.updateStudent(id, data),
  }));
};

export const deleteStudent = async (id) => {
  return tryRequest("DELETE", `/students/${id}`, undefined, () => mockDb.deleteStudent(id));
};

// Analytics
export const getAnalytics = async (institutionId) => {
  return tryRequest("GET", `/analytics?institutionId=${institutionId}`, undefined, () => mockDb.getAnalytics());
};

// Subscription
export const getSubscription = async (institutionId) => {
  return tryRequest("GET", `/subscription/${institutionId}`, undefined, () => mockDb.getSubscription());
};

export const getPlans = async () => {
  return tryRequest("GET", "/plans", undefined, () => ({
    plans: mockDb.getSubscription().plans,
  }));
};

// Curriculum
export const getCurriculum = async (board, classLabel) => {
  return tryRequest("GET", `/curriculum?board=${encodeURIComponent(board || "")}&classLabel=${encodeURIComponent(classLabel || "")}`, undefined, () => ({
    curricula: mockDb.getCurriculum(board, classLabel),
  }));
};

export const updateCurriculum = async (id, data) => {
  return tryRequest("PUT", `/curriculum/${id}`, data, () => {
    if (data.labId) {
      mockDb.toggleLabMandatory(id, data.labId);
    }
    return { success: true };
  });
};

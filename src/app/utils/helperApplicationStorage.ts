import { HelperProfile } from '@/app/data/mockData';

const HELPER_APPLICATIONS_STORAGE_KEY = 'hometask_helper_applications';

function readApplications(): HelperProfile[] {
  const rawApplications = localStorage.getItem(HELPER_APPLICATIONS_STORAGE_KEY);
  if (!rawApplications) {
    return [];
  }

  try {
    const parsedApplications = JSON.parse(rawApplications);
    return Array.isArray(parsedApplications) ? parsedApplications : [];
  } catch {
    localStorage.removeItem(HELPER_APPLICATIONS_STORAGE_KEY);
    return [];
  }
}

function writeApplications(applications: HelperProfile[]) {
  localStorage.setItem(HELPER_APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
}

export function getHelperApplications() {
  return readApplications().sort((a, b) => {
    const dateA = new Date(a.submittedAt ?? a.createdAt).getTime();
    const dateB = new Date(b.submittedAt ?? b.createdAt).getTime();
    return dateB - dateA;
  });
}

export function saveHelperApplication(application: HelperProfile) {
  const applications = readApplications();
  const existingIndex = applications.findIndex((item) => item.id === application.id);

  if (existingIndex >= 0) {
    applications[existingIndex] = application;
  } else {
    applications.unshift(application);
  }

  writeApplications(applications);
}

export function updateHelperApplicationStatus(
  helperId: string,
  status: HelperProfile['applicationStatus']
) {
  const applications = readApplications().map((application) => {
    if (application.id !== helperId) {
      return application;
    }

    return {
      ...application,
      applicationStatus: status,
      verified: status === 'approved',
    };
  });

  writeApplications(applications);
}

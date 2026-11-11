export type StatCardData = {
  title: string;
  value: string;
  description: string;
  trend: { direction: 'up' | 'down' | 'neutral'; value: string };
  icon: string;
};

/** A panel page's KPI figures; the page owns each card's title and icon, matched on `key`. */
export type KpiValue = {
  key: string;
  value: string;
  description: string;
  trend: { direction: 'up' | 'down' | 'neutral'; value: string };
};

export type MonthlyRevenue = {
  month: string;
  revenue: number;
};

export type MemberType = {
  type: string;
  count: number;
  fill: string;
};

export type ProjectStatus = {
  status: string;
  count: number;
  fill: string;
};

export type ActivityEntry = {
  id: string;
  initials: string;
  name: string;
  action: string;
  timestamp: string;
};

export type DashboardAlert = {
  id: string;
  type: 'warning' | 'success';
  title: string;
  description: string;
  metric: string | null;
};

export type ProjectRow = {
  id: number;
  name: string;
  status: string;
  teamLead: string;
  budget: number;
  deadline: string;
  progress: number;
};

export type ProjectMonthly = {
  month: string;
  completed: number;
  started: number;
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  email: string;
  department: string;
  status: string;
  utilization: number;
};

export type DepartmentDistribution = {
  department: string;
  count: number;
  fill: string;
};

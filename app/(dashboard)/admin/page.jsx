'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import * as XLSX from 'xlsx';
import {
  User as Usericon,
  Plus,
  Search,
  LogOut,
  FileSpreadsheet,
  LayoutGrid,
  X,
  ChevronDown,
  UserPlus,
  Users,
  Eye,
  EyeOff,
  Filter,
  Edit3,
  Save,
  SlidersHorizontal,
  Building2,
  Trash2,
  Briefcase,
  GitBranch,
} from 'lucide-react';

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  // Primary Data States
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [availableWorkflows, setAvailableWorkflows] = useState([]);
  const [allWorkflowSteps, setAllWorkflowSteps] = useState([]);
  const [customOrganizations, setCustomOrganizations] = useState([]);
  const [customDepartments, setCustomDepartments] = useState([]);

  // Column Filter States
  const [columnFilters, setColumnFilters] = useState({
    nameEmail: '',
    organization: 'ALL',
    department: 'ALL',
    status: 'ALL',
    role: 'ALL',
    workflow: 'ALL',
    dateAssignedMode: 'EXACT',
    dateAssigned: 'ALL',
    dateAssignedMonth: 'ALL',
    dateAssignedYear: 'ALL',
    durationDays: 'ALL',
    durationTime: 'ALL',
    dateCompletedMode: 'EXACT',
    dateCompleted: 'ALL',
    dateCompletedMonth: 'ALL',
    dateCompletedYear: 'ALL',
  });

  // UI Popovers & Dropdown States
  const [activeDateAssignedMenu, setActiveDateAssignedMenu] = useState(false);
  const [activeDateCompletedMenu, setActiveDateCompletedMenu] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);

  // Modal & Action Target States
  const [editingUser, setEditingUser] = useState(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteStage, setDeleteStage] = useState(0);
  const [deleteWorkflowTarget, setDeleteWorkflowTarget] = useState(null);

  // Workflow Assignment Modal States
  const [singleAssignTarget, setSingleAssignTarget] = useState(null);
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState([]);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [bulkSelectedWorkflowIds, setBulkSelectedWorkflowIds] = useState([]);

  // UI Dialog Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [isAddWorkflowModalOpen, setIsAddWorkflowModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, title: '', message: '' });

  // Forms & Import States
  const [newOrgName, setNewOrgName] = useState('');

  // Workflow Process Form State
  const [workflowForm, setWorkflowForm] = useState({
    organization: '',
    department: '',
    workflowName: '',
    managerEmail: '',
    steps: [''],
  });

  const [newEmp, setNewEmp] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CANDIDATE',
    organization: '',
    department: '',
  });

  const [showModalPassword, setShowModalPassword] = useState(false);
  const [parsedUsers, setParsedUsers] = useState([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [bulkDefaultOrg, setBulkDefaultOrg] = useState('');

  const showAlert = (title, message) => setErrorModal({ open: true, title, message });

  const calculateDaysTaken = (assignedDate, completedDate) => {
    if (!assignedDate || !completedDate) return null;
    const start = new Date(assignedDate);
    const end = new Date(completedDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 'Same Day' : `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  // Helper to extract clean ISO Date string (YYYY-MM-DD)
  const extractDateString = (timestampOrDate) => {
    if (!timestampOrDate) return null;
    return String(timestampOrDate).split('T')[0];
  };

  // Fetch Profiles from Supabase
  const fetchEmployeesFromSupabase = useCallback(async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');
      if (usersError) throw usersError;

      const { data: execCreds } = await supabase
        .from('executive_credentials')
        .select('user_id, assigned_password');

      const credMap = (execCreds || []).reduce((acc, curr) => {
        acc[curr.user_id] = curr.assigned_password;
        return acc;
      }, {});

      if (usersData) {
        const formatted = usersData.map((emp) => ({
          ...emp,
          name: emp.full_name || emp.name || '',
          organization: emp.organization || '',
          department: emp.department || '',
          password: emp.role === 'EXECUTIVE' ? credMap[emp.id] || '' : emp.password || '',
        }));
        setEmployees(formatted);
      }
    } catch (err) {
      showAlert('Error Loading Profiles', err.message);
    }
  }, [supabase]);

  // Fetch Workflows
  const fetchApprovedWorkflows = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('id, title, name, department, organization, manager_email');
      if (error) throw error;

      if (data && data.length > 0) {
        const fetched = data.map((t) => ({
          id: t.id,
          title: t.title || t.name || 'Untitled Workflow',
          department: t.department || '',
          organization: t.organization || '',
          managerEmail: t.manager_email || '',
        }));
        setAvailableWorkflows(fetched);
      } else {
        setAvailableWorkflows([]);
      }
    } catch (err) {
      setAvailableWorkflows([]);
    }
  }, [supabase]);

  // Fetch Workflow Steps
  const fetchAllWorkflowSteps = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .select('*, workflows(id, title, name)');
      if (error) throw error;
      if (data) setAllWorkflowSteps(data);
    } catch (err) {
      showAlert('Error Loading Workflow Steps', err.message);
    }
  }, [supabase]);

  useEffect(() => {
    let isSubscribed = true;
    const fetchSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          router.push('/admin-login');
          return;
        }

        const email = session.user.email;
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', email)
          .maybeSingle();

        if (!isSubscribed) return;

        const normalizedRole = (userData?.role || '').toUpperCase().replace(/\s+/g, '');
        if (normalizedRole !== 'ADMIN') {
          if (normalizedRole === 'EXECUTIVE') router.push('/executive');
          else if (normalizedRole === 'MANAGER') router.push('/manager');
          else router.push('/employee');
          return;
        }

        setCurrentUser({
          id: userData?.id || session.user.id,
          email: email,
          name: userData?.full_name || userData?.name || email.split('@')[0],
          isAdmin: true,
        });

        fetchEmployeesFromSupabase();
        fetchApprovedWorkflows();
        fetchAllWorkflowSteps();
      } catch (err) {
        if (isSubscribed) showAlert('Session Error', err.message);
      }
    };
    fetchSession();
    return () => {
      isSubscribed = false;
    };
  }, [router, supabase, fetchEmployeesFromSupabase, fetchApprovedWorkflows, fetchAllWorkflowSteps]);

  const getUserWorkflows = useCallback(
    (emp) => {
      return allWorkflowSteps.filter(
        (s) => s.performer_id === emp.id || s.userId === emp.id || s.userId === emp.email
      );
    },
    [allWorkflowSteps]
  );

  const availableOrganizations = useMemo(() => {
    const orgsSet = new Set(customOrganizations);
    employees.forEach((emp) => {
      if (emp.organization && emp.organization.trim()) {
        orgsSet.add(emp.organization.trim());
      }
    });
    return Array.from(orgsSet).sort();
  }, [employees, customOrganizations]);

  const availableDepartments = useMemo(() => {
    const deptSet = new Set(customDepartments);
    employees.forEach((emp) => {
      if (emp.department && emp.department.trim()) {
        deptSet.add(emp.department.trim());
      }
    });
    return Array.from(deptSet).sort();
  }, [employees, customDepartments]);

  // Dynamic Options for Data Table Filters
  const dynamicOptions = useMemo(() => {
    const orgs = new Set();
    const depts = new Set();
    const datesAssigned = new Set();
    const yearsAssigned = new Set();
    const datesCompleted = new Set();
    const yearsCompleted = new Set();
    const durationsDays = new Set();
    const durationsTime = new Set();

    employees.forEach((emp) => {
      if (emp.organization && emp.organization.trim()) orgs.add(emp.organization.trim());
      if (emp.department && emp.department.trim()) depts.add(emp.department.trim());
    });

    allWorkflowSteps.forEach((s) => {
      const aDate = extractDateString(s.start_time || s.created_at || s.assigned_date || s.assignedDate);
      if (aDate) {
        datesAssigned.add(aDate);
        const [yr] = aDate.split('-');
        if (yr) yearsAssigned.add(yr);
      }

      const cDate = extractDateString(s.end_time || s.completed_date || s.completedDate);
      if (cDate) {
        datesCompleted.add(cDate);
        const [yr] = cDate.split('-');
        if (yr) yearsCompleted.add(yr);
      }

      const daysTaken = calculateDaysTaken(aDate, cDate);
      if (daysTaken) durationsDays.add(daysTaken);

      const durationStr = s.duration_hours ? `${s.duration_hours} hrs` : s.duration;
      if (durationStr) durationsTime.add(String(durationStr));
    });

    return {
      orgs: Array.from(orgs).sort(),
      depts: Array.from(depts).sort(),
      datesAssigned: Array.from(datesAssigned).sort(),
      yearsAssigned: Array.from(yearsAssigned).sort(),
      datesCompleted: Array.from(datesCompleted).sort(),
      yearsCompleted: Array.from(yearsCompleted).sort(),
      durationsDays: Array.from(durationsDays).sort(),
      durationsTime: Array.from(durationsTime).sort(),
    };
  }, [employees, allWorkflowSteps]);

  // Available managers filtered strictly by selected organization and MANAGER role
  const availableManagers = useMemo(() => {
    if (!workflowForm.organization) return [];
    return employees.filter((emp) => {
      const isManagerRole = (emp.role || '').toUpperCase() === 'MANAGER';
      const matchesOrg =
        (emp.organization || '').trim().toLowerCase() ===
        workflowForm.organization.trim().toLowerCase();
      return isManagerRole && matchesOrg;
    });
  }, [employees, workflowForm.organization]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const userSteps = getUserWorkflows(emp);
      const nameEmailQuery = columnFilters.nameEmail.toLowerCase();
      const matchesNameEmail =
        !nameEmailQuery ||
        (emp.name || '').toLowerCase().includes(nameEmailQuery) ||
        (emp.email || '').toLowerCase().includes(nameEmailQuery);

      const empOrg = (emp.organization || '').trim();
      let matchesOrg = true;
      if (columnFilters.organization === 'UNASSIGNED') matchesOrg = !empOrg;
      else if (columnFilters.organization !== 'ALL')
        matchesOrg = empOrg.toLowerCase() === columnFilters.organization.toLowerCase();

      const empDept = (emp.department || '').trim();
      let matchesDept = true;
      if (columnFilters.department === 'UNASSIGNED') matchesDept = !empDept;
      else if (columnFilters.department !== 'ALL')
        matchesDept = empDept.toLowerCase() === columnFilters.department.toLowerCase();

      let matchesStatus = true;
      if (columnFilters.status === 'COMPLETED')
        matchesStatus = userSteps.some(
          (s) => s.status === 'APPROVED' || s.status === 'COMPLETED'
        );
      else if (columnFilters.status === 'PENDING')
        matchesStatus = userSteps.some(
          (s) => s.status === 'PENDING' || s.status === 'HANDED_OFF' || !s.status
        );
      else if (columnFilters.status === 'UNASSIGNED') matchesStatus = userSteps.length === 0;

      const empRole = (emp.role || 'CANDIDATE').toUpperCase();
      const matchesRole =
        columnFilters.role === 'ALL' || empRole === columnFilters.role.toUpperCase();

      const matchesWorkflow =
        columnFilters.workflow === 'ALL' ||
        (columnFilters.workflow === 'NONE' && userSteps.length === 0) ||
        userSteps.some((s) =>
          (s.workflows?.title || s.workflows?.name || s.task_name || s.title || '')
            .toLowerCase()
            .includes(columnFilters.workflow.toLowerCase())
        );

      let matchesDateAssigned = true;
      if (columnFilters.dateAssignedMode === 'EXACT') {
        matchesDateAssigned =
          columnFilters.dateAssigned === 'ALL' ||
          userSteps.some(
            (s) => extractDateString(s.start_time || s.created_at || s.assigned_date || s.assignedDate) === columnFilters.dateAssigned
          );
      } else {
        matchesDateAssigned = userSteps.some((s) => {
          const dateStr = extractDateString(s.start_time || s.created_at || s.assigned_date || s.assignedDate);
          if (!dateStr) return false;
          const [yr, mo] = dateStr.split('-');
          const matchesMo =
            columnFilters.dateAssignedMonth === 'ALL' || mo === columnFilters.dateAssignedMonth;
          const matchesYr =
            columnFilters.dateAssignedYear === 'ALL' || yr === columnFilters.dateAssignedYear;
          return matchesMo && matchesYr;
        });
      }

      const matchesDurationDays =
        columnFilters.durationDays === 'ALL' ||
        userSteps.some(
          (s) =>
            calculateDaysTaken(
              extractDateString(s.start_time || s.created_at || s.assigned_date || s.assignedDate),
              extractDateString(s.end_time || s.completed_date || s.completedDate)
            ) === columnFilters.durationDays
        );

      const matchesDurationTime =
        columnFilters.durationTime === 'ALL' ||
        userSteps.some(
          (s) => (s.duration_hours ? `${s.duration_hours} hrs` : s.duration) === columnFilters.durationTime
        );

      let matchesDateCompleted = true;
      if (columnFilters.dateCompletedMode === 'EXACT') {
        matchesDateCompleted =
          columnFilters.dateCompleted === 'ALL' ||
          userSteps.some(
            (s) => extractDateString(s.end_time || s.completed_date || s.completedDate) === columnFilters.dateCompleted
          );
      } else {
        matchesDateCompleted = userSteps.some((s) => {
          const dateStr = extractDateString(s.end_time || s.completed_date || s.completedDate);
          if (!dateStr) return false;
          const [yr, mo] = dateStr.split('-');
          const matchesMo =
            columnFilters.dateCompletedMonth === 'ALL' || mo === columnFilters.dateCompletedMonth;
          const matchesYr =
            columnFilters.dateCompletedYear === 'ALL' || yr === columnFilters.dateCompletedYear;
          return matchesMo && matchesYr;
        });
      }

      return (
        matchesNameEmail &&
        matchesOrg &&
        matchesDept &&
        matchesStatus &&
        matchesRole &&
        matchesWorkflow &&
        matchesDateAssigned &&
        matchesDurationDays &&
        matchesDurationTime &&
        matchesDateCompleted
      );
    });
  }, [employees, columnFilters, getUserWorkflows]);

  // Handlers
  const handleAddOrganization = async (e) => {
    e.preventDefault();
    const trimmed = newOrgName.trim();
    if (!trimmed) return;
    const { error } = await supabase.from('organizations').insert([{ name: trimmed }]);
    if (error) {
      showAlert('Error Adding Organization', error.message);
      return;
    }
    setCustomOrganizations((prev) => [...prev, trimmed]);
    setNewOrgName('');
    setIsAddOrgModalOpen(false);
    showAlert('Success', `Organization "${trimmed}" saved permanently.`);
  };

  const handleStepChange = (index, value) => {
    const updatedSteps = [...workflowForm.steps];
    updatedSteps[index] = value;
    setWorkflowForm({ ...workflowForm, steps: updatedSteps });
  };

  const handleAddStepField = () => {
    setWorkflowForm({ ...workflowForm, steps: [...workflowForm.steps, ''] });
  };

  const handleRemoveStepField = (index) => {
    if (workflowForm.steps.length <= 1) return;
    const updatedSteps = workflowForm.steps.filter((_, idx) => idx !== index);
    setWorkflowForm({ ...workflowForm, steps: updatedSteps });
  };

  // Save Workflow Process Handler (saves directly to workflows and workflow_steps)
  const handleSaveWorkflowProcess = async (e) => {
    e.preventDefault();
    const { organization, department, workflowName, managerEmail, steps } = workflowForm;

    if (!organization || !department || !workflowName.trim()) {
      showAlert('Validation Error', 'Please complete all required workflow fields.');
      return;
    }

    if (!managerEmail) {
      showAlert('Validation Error', 'Please select a reviewing manager.');
      return;
    }

    const validSteps = steps.map((s) => s.trim()).filter((s) => s.length > 0);
    if (validSteps.length === 0) {
      showAlert('Validation Error', 'Please enter at least one step for the workflow process.');
      return;
    }

    try {
      // 1. Insert workflow process record into 'workflows' table
      const { data: wfData, error: wfError } = await supabase
        .from('workflows')
        .insert({
          title: workflowName.trim(),
          name: workflowName.trim(),
          organization: organization,
          department: department,
          manager_email: managerEmail,
          is_approved: true,
        })
        .select()
        .single();

      if (wfError) throw wfError;

      // 2. Insert workflow steps directly into 'workflow_steps' table
      const stepInserts = validSteps.map((stepDesc, idx) => ({
        workflow_id: wfData.id,
        step_order: idx + 1,
        task_name: stepDesc,
        title: stepDesc,
        status: 'PENDING',
        is_final_step: idx === validSteps.length - 1,
      }));

      const { error: stepsError } = await supabase
        .from('workflow_steps')
        .insert(stepInserts);

      if (stepsError) throw stepsError;

      showAlert('Success', `Workflow process "${workflowName}" successfully saved!`);
      setIsAddWorkflowModalOpen(false);
      setWorkflowForm({
        organization: '',
        department: '',
        workflowName: '',
        managerEmail: '',
        steps: [''],
      });
      fetchApprovedWorkflows();
      fetchAllWorkflowSteps();
    } catch (err) {
      showAlert('Error Saving Workflow', err.message);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedEmpIds(filteredEmployees.map((emp) => emp.id));
    else setSelectedEmpIds([]);
  };

  const handleSelectEmp = (empId) => {
    setSelectedEmpIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleOpenEditModalForSelected = () => {
    if (selectedEmpIds.length !== 1) return;
    const targetEmp = employees.find((e) => e.id === selectedEmpIds[0]);
    if (targetEmp) {
      setEditingUser({
        ...targetEmp,
        name: targetEmp.name || targetEmp.full_name || '',
        organization: targetEmp.organization || '',
        department: targetEmp.department || '',
        employee_id: targetEmp.employee_id || '',
        job_title: targetEmp.job_title || '',
        manager: targetEmp.manager || '',
        city: targetEmp.city || '',
        country: targetEmp.country || '',
        gender: targetEmp.gender || '',
        age: targetEmp.age || '',
        years_in_company: targetEmp.years_in_company || '',
        years_in_role: targetEmp.years_in_role || '',
        password: targetEmp.password || '',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const targetId = deleteTarget.id;
      const targetEmail = deleteTarget.email?.toLowerCase().trim();

      if (targetId) {
        await supabase.from('workflow_steps').delete().eq('performer_id', targetId);
      }

      if (deleteTarget.role === 'EXECUTIVE') {
        await supabase.from('executive_credentials').delete().or(`user_id.eq.${targetId},email.ilike.${targetEmail}`);
      }

      const { error: userErr } = await supabase
        .from('profiles')
        .delete()
        .or(`id.eq.${targetId},email.ilike.${targetEmail}`);
      if (userErr) throw userErr;

      showAlert(
        'Success',
        `${deleteTarget.name || targetEmail} and associated data have been permanently deleted.`
      );
      setDeleteStage(0);
      setDeleteTarget(null);
      setSelectedEmpIds([]);
      fetchEmployeesFromSupabase();
      fetchAllWorkflowSteps();
    } catch (err) {
      showAlert('Delete Action Failed', err.message || 'Error occurred while deleting user.');
    }
  };

  const handleDeleteWorkflowStep = async () => {
    if (!deleteWorkflowTarget) return;
    try {
      const { error } = await supabase
        .from('workflow_steps')
        .delete()
        .eq('id', deleteWorkflowTarget.id);
      if (error) throw error;
      showAlert(
        'Success',
        `Workflow step deleted successfully.`
      );
      setDeleteWorkflowTarget(null);
      fetchAllWorkflowSteps();
    } catch (err) {
      showAlert('Delete Action Failed', err.message);
    }
  };

  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.name,
          email: editingUser.email.toLowerCase().trim(),
          role: editingUser.role,
          organization: editingUser.organization ? editingUser.organization.trim() : null,
          department: editingUser.department ? editingUser.department.trim() : null,
          employee_id: editingUser.employee_id ? editingUser.employee_id.trim() : null,
          job_title: editingUser.job_title ? editingUser.job_title.trim() : null,
          manager: editingUser.manager ? editingUser.manager.trim() : null,
          city: editingUser.city ? editingUser.city.trim() : null,
          country: editingUser.country ? editingUser.country.trim() : null,
          gender: editingUser.gender ? editingUser.gender.trim() : null,
          age: editingUser.age !== '' ? parseInt(editingUser.age, 10) : null,
          years_in_company:
            editingUser.years_in_company !== ''
              ? parseFloat(editingUser.years_in_company)
              : null,
          years_in_role:
            editingUser.years_in_role !== '' ? parseFloat(editingUser.years_in_role) : null,
        })
        .eq('id', editingUser.id);
      if (error) throw error;

      if (editingUser.role === 'EXECUTIVE' && editingUser.password) {
        await supabase.from('executive_credentials').upsert(
          {
            user_id: editingUser.id,
            email: editingUser.email.toLowerCase().trim(),
            assigned_password: editingUser.password,
            organization: editingUser.organization ? editingUser.organization.trim() : null,
          },
          { onConflict: 'user_id' }
        );
      }
      showAlert('Success', 'User profile updated in database.');
      setEditingUser(null);
      fetchEmployeesFromSupabase();
    } catch (err) {
      showAlert('Database Update Blocked', err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const trimmedEmail = newEmp.email.trim().toLowerCase();
    const trimmedOrg = newEmp.organization ? newEmp.organization.trim() : null;
    const trimmedDept = newEmp.department ? newEmp.department.trim() : null;

    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', trimmedEmail)
        .maybeSingle();

      if (existingUser) {
        showAlert('User Exists', `A profile with email ${trimmedEmail} already exists.`);
        return;
      }

      if (newEmp.role === 'EXECUTIVE') {
        if (!newEmp.password) {
          showAlert('Password Required', 'Executive accounts require a pre-assigned password.');
          return;
        }
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            full_name: newEmp.name,
            email: trimmedEmail,
            role: 'EXECUTIVE',
            organization: trimmedOrg,
            department: trimmedDept,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        await supabase.from('executive_credentials').insert({
          user_id: profileData.id,
          email: trimmedEmail,
          assigned_password: newEmp.password,
          organization: trimmedOrg,
        });

        showAlert(
          'Success',
          `Executive account record created for ${trimmedEmail}.`
        );
      } else {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            full_name: newEmp.name,
            email: trimmedEmail,
            role: newEmp.role,
            organization: trimmedOrg,
            department: trimmedDept,
          });
        if (insertError) throw insertError;
        showAlert('Record Created', `Profile for ${trimmedEmail} saved to database.`);
      }

      setIsAddModalOpen(false);
      setNewEmp({
        name: '',
        email: '',
        password: '',
        role: 'CANDIDATE',
        organization: '',
        department: '',
      });
      setShowModalPassword(false);
      fetchEmployeesFromSupabase();
    } catch (err) {
      showAlert('User Creation Error', err.message || 'Failed to create user record.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawRows.length === 0) {
          showAlert('Empty Spreadsheet', 'The uploaded file contains no data.');
          return;
        }

        const parsedList = [];
        for (const row of rawRows) {
          const nRow = {};
          Object.keys(row).forEach((key) => {
            nRow[key.trim().toLowerCase()] = String(row[key]).trim();
          });
          const fullName = nRow['full name'] || nRow['fullname'] || nRow['name'] || '';
          const email = (nRow['email'] || '').toLowerCase();
          const role = (nRow['role'] || 'CANDIDATE').toUpperCase();
          const parsedOrg = nRow['organization'] || nRow['org'] || nRow['company'] || '';
          const parsedDept = nRow['department'] || nRow['dept'] || '';

          if (!email || !email.includes('@')) continue;

          parsedList.push({
            full_name: fullName || email.split('@')[0],
            email: email,
            role: ['EXECUTIVE', 'ADMIN', 'MANAGER'].includes(role) ? role : 'CANDIDATE',
            organization: parsedOrg || null,
            department: parsedDept || null,
            employee_id: nRow['employee id'] || nRow['employeeid'] || null,
            job_title: nRow['job title'] || nRow['jobtitle'] || null,
            manager: nRow['manager'] || null,
            city: nRow['city'] || null,
            country: nRow['country'] || nRow['location'] || null,
            gender: nRow['gender'] || nRow['sex'] || null,
            age: nRow['age'] ? parseInt(nRow['age'], 10) : null,
            years_in_company:
              nRow['years in company'] || nRow['yearsincompany']
                ? parseFloat(nRow['years in company'] || nRow['yearsincompany'])
                : null,
            years_in_role:
              nRow['years in role'] || nRow['yearsinrole']
                ? parseFloat(nRow['years in role'] || nRow['yearsinrole'])
                : null,
          });
        }

        if (parsedList.length === 0) {
          showAlert(
            'Header Missing or Invalid Data',
            'Spreadsheet must contain "Full Name" and "Email" columns.'
          );
          setUploadFileName('');
          return;
        }
        setParsedUsers(parsedList);
      } catch (err) {
        showAlert('Parsing Error', err.message || 'Failed to read spreadsheet file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkInsert = async () => {
    if (parsedUsers.length === 0) return;
    const finalUsersToInsert = parsedUsers.map((u) => ({
      ...u,
      organization: u.organization ? u.organization : bulkDefaultOrg.trim() || null,
    }));

    const { data, error } = await supabase.from('profiles').insert(finalUsersToInsert).select();
    if (error) {
      showAlert('Bulk Import Error', error.message);
    } else {
      showAlert('Success', `Successfully imported ${data ? data.length : parsedUsers.length} users into Supabase.`);
      setIsUploadModalOpen(false);
      setParsedUsers([]);
      setUploadFileName('');
      setBulkDefaultOrg('');
      fetchEmployeesFromSupabase();
    }
  };

  const handleSingleUserAssignSubmit = async () => {
    if (!singleAssignTarget || selectedWorkflowIds.length === 0) {
      showAlert('Selection Required', 'Please select at least one workflow.');
      return;
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const newAssignments = selectedWorkflowIds.map((wfId) => {
      const wfObj = availableWorkflows.find((t) => String(t.id) === String(wfId));
      return {
        performer_id: singleAssignTarget.id,
        workflow_id: wfObj.id,
        task_name: wfObj.title,
        title: wfObj.title,
        assigned_by: currentUser.id, // Fixed: Pass UUID instead of email string
        start_time: todayDate,
        assigned_date: todayDate,
        status: 'PENDING',
      };
    });

    const { error } = await supabase.from('workflow_steps').insert(newAssignments);

    if (error) {
      showAlert('Assignment Error', error.message);
    } else {
      showAlert(
        'Success',
        `Assigned ${selectedWorkflowIds.length} workflow(s) to ${singleAssignTarget.email}`
      );
      setSingleAssignTarget(null);
      setSelectedWorkflowIds([]);
      fetchAllWorkflowSteps();
    }
  };

  const handleBulkAssignSubmit = async () => {
    if (bulkSelectedWorkflowIds.length === 0) {
      showAlert('Selection Required', 'Please select at least one workflow.');
      return;
    }

    const targetUsers = employees.filter((emp) => selectedEmpIds.includes(emp.id));
    const todayDate = new Date().toISOString().split('T')[0];
    const newAssignments = [];

    targetUsers.forEach((emp) => {
      bulkSelectedWorkflowIds.forEach((wfId) => {
        const wfObj = availableWorkflows.find((t) => String(t.id) === String(wfId));
        newAssignments.push({
          performer_id: emp.id,
          workflow_id: wfObj.id,
          task_name: wfObj.title,
          title: wfObj.title,
          assigned_by: currentUser.id, // Fixed: Pass UUID instead of email string
          start_time: todayDate,
          assigned_date: todayDate,
          status: 'PENDING',
        });
      });
    });

    const { error } = await supabase.from('workflow_steps').insert(newAssignments);

    if (error) {
      showAlert('Bulk Assign Error', error.message);
    } else {
      showAlert(
        'Success',
        `Assigned ${bulkSelectedWorkflowIds.length} workflow(s) to ${targetUsers.length} candidates.`
      );
      setIsBulkAssignModalOpen(false);
      setSelectedEmpIds([]);
      setBulkSelectedWorkflowIds([]);
      fetchAllWorkflowSteps();
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('portalMode');
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  const resetFilters = () => {
    setColumnFilters({
      nameEmail: '',
      organization: 'ALL',
      department: 'ALL',
      status: 'ALL',
      role: 'ALL',
      workflow: 'ALL',
      dateAssignedMode: 'EXACT',
      dateAssigned: 'ALL',
      dateAssignedMonth: 'ALL',
      dateAssignedYear: 'ALL',
      durationDays: 'ALL',
      durationTime: 'ALL',
      dateCompletedMode: 'EXACT',
      dateCompleted: 'ALL',
      dateCompletedMonth: 'ALL',
      dateCompletedYear: 'ALL',
    });
  };

  if (!currentUser) return null;

  const isAllFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedEmpIds.includes(emp.id));

  const isAnyFilterActive =
    columnFilters.nameEmail !== '' ||
    columnFilters.organization !== 'ALL' ||
    columnFilters.department !== 'ALL' ||
    columnFilters.status !== 'ALL' ||
    columnFilters.role !== 'ALL' ||
    columnFilters.workflow !== 'ALL' ||
    columnFilters.dateAssigned !== 'ALL' ||
    columnFilters.dateAssignedMonth !== 'ALL' ||
    columnFilters.dateAssignedYear !== 'ALL' ||
    columnFilters.durationDays !== 'ALL' ||
    columnFilters.durationTime !== 'ALL' ||
    columnFilters.dateCompleted !== 'ALL' ||
    columnFilters.dateCompletedMonth !== 'ALL' ||
    columnFilters.dateCompletedYear !== 'ALL';

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-[#1F1F3B] font-sans antialiased select-none flex flex-col w-full">
      {/* Error Alert Modal */}
      {errorModal.open && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-[#EEEEF4]">
            <h3 className="font-bold text-[#1F1F3B] text-sm">{errorModal.title}</h3>
            <p className="text-xs text-[#79768D]">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal({ open: false, title: '', message: '' })}
              className="w-full py-2 bg-[#1F1F3B] text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-[#363550] transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Add Organization Modal */}
      {isAddOrgModalOpen && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#EEEEF4]">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#1F1F3B]" />
                <h3 className="font-bold text-[#1F1F3B] text-sm">Add New Organization</h3>
              </div>
              <button onClick={() => setIsAddOrgModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-[#A6A1B6]" />
              </button>
            </div>
            <form onSubmit={handleAddOrganization} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#1F1F3B]">
                  Organization Name *
                </label>
                <input
                  required
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#1F1F3B]"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOrgModalOpen(false)}
                  className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#1F1F3B] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#363550] transition-colors"
                >
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Workflow Process Modal */}
      {isAddWorkflowModalOpen && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-[#EEEEF4] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-[#1F1F3B]" />
                <h3 className="font-bold text-[#1F1F3B] text-sm">Add Workflow Process</h3>
              </div>
              <button onClick={() => setIsAddWorkflowModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-[#A6A1B6]" />
              </button>
            </div>
            <form onSubmit={handleSaveWorkflowProcess} className="space-y-4 text-xs">
              {/* Organization Selection */}
              <div>
                <label className="block font-bold mb-1 text-[#1F1F3B]">Select Organization *</label>
                <select
                  required
                  value={workflowForm.organization}
                  onChange={(e) =>
                    setWorkflowForm({
                      ...workflowForm,
                      organization: e.target.value,
                      managerEmail: '',
                    })
                  }
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs font-semibold text-[#1F1F3B] focus:outline-none focus:ring-1 focus:ring-[#1F1F3B]"
                >
                  <option value="">-- Choose Organization --</option>
                  {availableOrganizations.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Selection */}
              <div>
                <label className="block font-bold mb-1 text-[#1F1F3B]">Select Department *</label>
                <select
                  required
                  value={workflowForm.department}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, department: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs font-semibold text-[#1F1F3B] focus:outline-none focus:ring-1 focus:ring-[#1F1F3B]"
                >
                  <option value="">-- Choose Department --</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Workflow Name */}
              <div>
                <label className="block font-bold mb-1 text-[#1F1F3B]">Workflow Process Name *</label>
                <input
                  required
                  type="text"
                  value={workflowForm.workflowName}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, workflowName: e.target.value })}
                  placeholder="e.g. Hiring Process, Recruitment Process"
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#1F1F3B]"
                />
              </div>

              {/* Workflow Steps Builder */}
              <div className="space-y-2">
                <label className="block font-bold text-[#1F1F3B]">Workflow Steps *</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {workflowForm.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1F1F3B] w-5 text-right">{idx + 1}.</span>
                      <input
                        required
                        type="text"
                        value={step}
                        onChange={(e) => handleStepChange(idx, e.target.value)}
                        placeholder="Short description of step..."
                        className="flex-1 p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#1F1F3B]"
                      />
                      {workflowForm.steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStepField(idx)}
                          className="p-1.5 text-[#A6A1B6] hover:text-rose-600 transition-colors"
                          title="Remove Step"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddStepField}
                  className="mt-1 px-3 py-1.5 bg-[#EEEEF4] hover:bg-[#E5E3ED] text-[#1F1F3B] font-bold text-[11px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Step</span>
                </button>
              </div>

              {/* Reviewing Manager Email Dropdown */}
              <div>
                <label className="block font-bold mb-1 text-[#1F1F3B]">Reviewing Manager *</label>
                <select
                  required
                  disabled={!workflowForm.organization}
                  value={workflowForm.managerEmail}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, managerEmail: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs font-semibold text-[#1F1F3B] focus:outline-none focus:ring-1 focus:ring-[#1F1F3B] disabled:opacity-50"
                >
                  <option value="">
                    {workflowForm.organization
                      ? '-- Select Manager Email --'
                      : '-- Select Organization First --'}
                  </option>
                  {availableManagers.map((mgr) => (
                    <option key={mgr.id || mgr.email} value={mgr.email}>
                      {mgr.email} {mgr.name ? `(${mgr.name})` : ''}
                    </option>
                  ))}
                </select>
                {workflowForm.organization && availableManagers.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    No managers found for this organization.
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#EEEEF4]">
                <button
                  type="button"
                  onClick={() => setIsAddWorkflowModalOpen(false)}
                  className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#1F1F3B] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#363550] transition-colors"
                >
                  Save Workflow Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteStage > 0 && deleteTarget && (
        <div className="fixed inset-0 bg-[#1F1F3B]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-rose-100">
            {deleteStage === 1 && (
              <>
                <div className="space-y-1">
                  <h3 className="font-bold text-[#1F1F3B] text-sm">
                    Confirmation 1 of 2: Delete User?
                  </h3>
                  <p className="text-xs text-[#4C4B64]">
                    Are you sure you want to delete <b>{deleteTarget.name}</b> (
                    <span className="font-mono">{deleteTarget.email}</span>) from the system?
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setDeleteStage(0);
                      setDeleteTarget(null);
                    }}
                    className="w-1/2 py-2 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeleteStage(2)}
                    className="w-1/2 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-rose-700"
                  >
                    Next Step &rarr;
                  </button>
                </div>
              </>
            )}
            {deleteStage === 2 && (
              <>
                <div className="space-y-2">
                  <h3 className="font-bold text-rose-600 text-sm flex items-center gap-1.5">
                    Final Warning (Confirmation 2 of 2)
                  </h3>
                  <p className="text-xs text-[#4C4B64] leading-relaxed">
                    This action will <b>permanently erase</b> all profile data and workflows directly in Supabase.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setDeleteStage(1)}
                    className="w-1/2 py-2 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="w-1/2 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-rose-700 shadow-xs"
                  >
                    Yes, Permanently Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Workflow Step Modal */}
      {deleteWorkflowTarget && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-rose-100">
            <div className="space-y-1">
              <h3 className="font-bold text-[#1F1F3B] text-sm">Delete Workflow Step?</h3>
              <p className="text-xs text-[#4C4B64] leading-relaxed">
                Are you sure you want to remove the workflow step{' '}
                <b>"{deleteWorkflowTarget.task_name || deleteWorkflowTarget.title}"</b>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteWorkflowTarget(null)}
                className="w-1/2 py-2 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkflowStep}
                className="w-1/2 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single User Workflow Assign Modal */}
      {singleAssignTarget && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#EEEEF4]">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <div>
                <h3 className="font-bold text-[#1F1F3B] text-sm">Assign Workflows</h3>
                <p className="text-[11px] text-[#79768D]">
                  Assigning to: <b>{singleAssignTarget.name || singleAssignTarget.email}</b>
                </p>
              </div>
              <button
                onClick={() => {
                  setSingleAssignTarget(null);
                  setSelectedWorkflowIds([]);
                }}
                className="cursor-pointer"
              >
                <X className="w-4 h-4 text-[#A6A1B6]" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <label className="block text-xs font-bold text-[#1F1F3B] mb-1">
                Select Workflows to Assign:
              </label>
              {availableWorkflows.length === 0 ? (
                <p className="text-xs text-[#79768D]">No approved workflows found.</p>
              ) : (
                availableWorkflows.map((wf) => {
                  const isChecked = selectedWorkflowIds.includes(wf.id);
                  return (
                    <label
                      key={wf.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F7F9FB] border border-[#EEEEF4] text-xs font-semibold text-[#1F1F3B] cursor-pointer hover:bg-[#EEEEF4]"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setSelectedWorkflowIds((prev) =>
                            prev.includes(wf.id)
                              ? prev.filter((id) => id !== wf.id)
                              : [...prev, wf.id]
                          )
                        }
                        className="rounded-md border-[#D3CCDE] text-[#1F1F3B]"
                      />
                      <span>{wf.title}</span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#EEEEF4]">
              <button
                type="button"
                onClick={() => {
                  setSingleAssignTarget(null);
                  setSelectedWorkflowIds([]);
                }}
                className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSingleUserAssignSubmit}
                className="w-1/2 py-2.5 bg-[#1F1F3B] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#363550]"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Workflows Modal */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#EEEEF4]">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <div>
                <h3 className="font-bold text-[#1F1F3B] text-sm">Bulk Assign Workflows</h3>
                <p className="text-[11px] text-[#79768D]">
                  Selected Candidates: <b>{selectedEmpIds.length} users</b>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsBulkAssignModalOpen(false);
                  setBulkSelectedWorkflowIds([]);
                }}
                className="cursor-pointer"
              >
                <X className="w-4 h-4 text-[#A6A1B6]" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <label className="block text-xs font-bold text-[#1F1F3B] mb-1">
                Select Workflows to Assign to All Selected:
              </label>
              {availableWorkflows.length === 0 ? (
                <p className="text-xs text-[#79768D]">No approved workflows available.</p>
              ) : (
                availableWorkflows.map((wf) => {
                  const isChecked = bulkSelectedWorkflowIds.includes(wf.id);
                  return (
                    <label
                      key={wf.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F7F9FB] border border-[#EEEEF4] text-xs font-semibold text-[#1F1F3B] cursor-pointer hover:bg-[#EEEEF4]"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setBulkSelectedWorkflowIds((prev) =>
                            prev.includes(wf.id)
                              ? prev.filter((id) => id !== wf.id)
                              : [...prev, wf.id]
                          )
                        }
                        className="rounded-md border-[#D3CCDE] text-[#1F1F3B]"
                      />
                      <span>{wf.title}</span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#EEEEF4]">
              <button
                type="button"
                onClick={() => {
                  setIsBulkAssignModalOpen(false);
                  setBulkSelectedWorkflowIds([]);
                }}
                className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkAssignSubmit}
                className="w-1/2 py-2.5 bg-[#1F1F3B] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#363550]"
              >
                Assign to Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Personal Information Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-[#EEEEF4] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <h3 className="font-bold text-[#1F1F3B] text-sm">Edit User Profile</h3>
              <button onClick={() => setEditingUser(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-[#A6A1B6]" />
              </button>
            </div>

            <form onSubmit={handleSavePersonalInfo} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Email</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Role</label>
                  <select
                    value={editingUser.role || 'CANDIDATE'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs font-bold"
                  >
                    <option value="CANDIDATE">Candidate / Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="EXECUTIVE">Executive</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Organization</label>
                  <input
                    type="text"
                    value={editingUser.organization || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, organization: e.target.value })
                    }
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Department</label>
                  <input
                    type="text"
                    value={editingUser.department || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, department: e.target.value })
                    }
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
              </div>

              {editingUser.role === 'EXECUTIVE' && (
                <div className="p-3 bg-[#EEEEF4]/50 border border-[#D3CCDE] rounded-xl space-y-2">
                  <label className="block font-bold text-[#1F1F3B]">
                    Pre-assigned Executive Password
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editingUser.password || ''}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, password: e.target.value })
                      }
                      placeholder="Enter executive password"
                      className="w-full p-2 bg-white border border-[#D3CCDE] rounded-xl text-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#79768D]"
                    >
                      {showEditPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Employee ID</label>
                  <input
                    type="text"
                    value={editingUser.employee_id || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, employee_id: e.target.value })
                    }
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Job Title</label>
                  <input
                    type="text"
                    value={editingUser.job_title || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, job_title: e.target.value })}
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Manager</label>
                  <input
                    type="text"
                    value={editingUser.manager || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, manager: e.target.value })}
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">City</label>
                  <input
                    type="text"
                    value={editingUser.city || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Country</label>
                  <input
                    type="text"
                    value={editingUser.country || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, country: e.target.value })}
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Gender</label>
                  <input
                    type="text"
                    value={editingUser.gender || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, gender: e.target.value })}
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Age</label>
                  <input
                    type="number"
                    value={editingUser.age || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, age: e.target.value })}
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Yrs in Co.</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingUser.years_in_company || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, years_in_company: e.target.value })
                    }
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Yrs in Role</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingUser.years_in_role || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, years_in_role: e.target.value })
                    }
                    className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#EEEEF4]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#1F1F3B] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#363550]"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#EEEEF4]">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <h3 className="font-bold text-[#1F1F3B] text-sm">Add New User</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-[#A6A1B6]" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#1F1F3B]">Full Name *</label>
                <input
                  required
                  type="text"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#1F1F3B]">Email Address *</label>
                <input
                  required
                  type="email"
                  value={newEmp.email}
                  onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  placeholder="e.g. j.doe@company.com"
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#1F1F3B]">Role *</label>
                <select
                  value={newEmp.role}
                  onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs font-bold"
                >
                  <option value="CANDIDATE">Candidate / Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EXECUTIVE">Executive</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {newEmp.role === 'EXECUTIVE' && (
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">
                    Pre-assigned Password *
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={showModalPassword ? 'text' : 'password'}
                      value={newEmp.password}
                      onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                      placeholder="Assign password for executive"
                      className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#79768D]"
                    >
                      {showModalPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Organization</label>
                  <select
                    value={newEmp.organization}
                    onChange={(e) => setNewEmp({ ...newEmp, organization: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs font-semibold"
                  >
                    <option value="">-- Optional --</option>
                    {availableOrganizations.map((org) => (
                      <option key={org} value={org}>
                        {org}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#1F1F3B]">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs font-semibold"
                  >
                    <option value="">-- Optional --</option>
                    {availableDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#EEEEF4]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#1F1F3B] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#363550]"
                >
                  Create User Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-[#EEEEF4]">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <h3 className="font-bold text-[#1F1F3B] text-sm">Bulk Import Users (Spreadsheet)</h3>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setParsedUsers([]);
                  setUploadFileName('');
                }}
                className="cursor-pointer"
              >
                <X className="w-4 h-4 text-[#A6A1B6]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#1F1F3B]">
                  Default Organization (Fallback if missing in sheet)
                </label>
                <input
                  type="text"
                  value={bulkDefaultOrg}
                  onChange={(e) => setBulkDefaultOrg(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs"
                />
              </div>

              <div className="border-2 border-dashed border-[#D3CCDE] rounded-2xl p-6 text-center space-y-2 bg-[#F7F9FB]">
                <FileSpreadsheet className="w-8 h-8 text-[#79768D] mx-auto" />
                <p className="text-xs font-semibold text-[#1F1F3B]">
                  Upload CSV or Excel Spreadsheet (.xlsx, .csv)
                </p>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="inline-block px-4 py-2 bg-[#1F1F3B] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#363550]"
                >
                  Browse File
                </label>
                {uploadFileName && (
                  <p className="text-[11px] font-bold text-emerald-600 mt-2">
                    Selected: {uploadFileName} ({parsedUsers.length} valid profiles parsed)
                  </p>
                )}
              </div>

              {parsedUsers.length > 0 && (
                <div className="max-h-36 overflow-y-auto border border-[#EEEEF4] rounded-xl p-2 bg-[#F7F9FB]">
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-[#D3CCDE] font-bold">
                        <th className="p-1">Name</th>
                        <th className="p-1">Email</th>
                        <th className="p-1">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedUsers.slice(0, 5).map((u, i) => (
                        <tr key={i} className="border-b border-[#EEEEF4]">
                          <td className="p-1">{u.full_name}</td>
                          <td className="p-1">{u.email}</td>
                          <td className="p-1 font-bold">{u.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedUsers.length > 5 && (
                    <p className="text-[10px] text-[#79768D] mt-1 text-center">
                      ...and {parsedUsers.length - 5} more users.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#EEEEF4]">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setParsedUsers([]);
                  setUploadFileName('');
                }}
                className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={parsedUsers.length === 0}
                onClick={handleBulkInsert}
                className="w-1/2 py-2.5 bg-[#1F1F3B] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#363550] disabled:opacity-50"
              >
                Import {parsedUsers.length} Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER NAVIGATION BAR */}
      <header className="bg-white border-b border-[#EEEEF4] sticky top-0 z-30 px-6 py-3 flex items-center justify-between h-16 shadow-2xs">
        <div className="flex items-center gap-3">
          <Image
            src="/ivy-logo-dark.png"
            alt="IVY & COMPANY"
            width={48}
            height={32}
            priority
            className="object-contain"
          />
          <span className="text-[10px] font-bold tracking-[0.18em] text-[#79768D] uppercase border-l border-[#EEEEF4] pl-3 py-1">
            Admin Management Console
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F7F9FB] border border-[#EEEEF4] rounded-full px-3 py-1.5 text-[#1F1F3B]">
            <Usericon className="w-3.5 h-3.5 text-[#79768D]" />
            <span className="text-xs font-semibold">{currentUser.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 border border-[#EEEEF4] rounded-xl hover:bg-[#F7F9FB] text-[#79768D] hover:text-[#1F1F3B] transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER WORKSPACE */}
      <main className="flex-1 px-6 py-6 space-y-4 max-w-[1700px] w-full mx-auto">
        {/* HEADER TOOLBAR & ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EEEEF4] shadow-2xs">
          <div>
            <h1 className="text-lg font-bold text-[#1F1F3B]">User & Workflow Administration</h1>
            <p className="text-xs text-[#79768D]">
              Manage candidates, assign workflows, filter data, and oversee employee performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAnyFilterActive && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 bg-[#EEEEF4] hover:bg-[#E5E3ED] text-[#4C4B64] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}

            <button
              onClick={() => setIsAddOrgModalOpen(true)}
              className="px-3.5 py-2 bg-[#F7F9FB] hover:bg-[#EEEEF4] border border-[#D3CCDE] text-[#1F1F3B] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#1F1F3B]" />
              <span>Add Organization</span>
            </button>

            <button
              onClick={() => setIsAddWorkflowModalOpen(true)}
              className="px-3.5 py-2 bg-[#F7F9FB] hover:bg-[#EEEEF4] border border-[#D3CCDE] text-[#1F1F3B] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#1F1F3B]" />
              <span>Add Workflow Process</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2 bg-[#F7F9FB] hover:bg-[#EEEEF4] border border-[#D3CCDE] text-[#1F1F3B] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bulk Import</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-[#1F1F3B] hover:bg-[#363550] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* BULK SELECTION ACTION TOOLBAR */}
        {selectedEmpIds.length > 0 && (
          <div className="bg-[#1F1F3B] text-white p-3 rounded-2xl flex items-center justify-between px-5 text-xs shadow-md animate-in fade-in duration-150">
            <span className="font-semibold">
              {selectedEmpIds.length} candidate(s) selected
            </span>
            <div className="flex items-center gap-3">
              {selectedEmpIds.length === 1 && (
                <button
                  onClick={handleOpenEditModalForSelected}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
              <button
                onClick={() => setIsBulkAssignModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Workflows to Selected</span>
              </button>
            </div>
          </div>
        )}

        {/* DATA TABLE CONTAINER */}
        <div className="bg-white rounded-2xl border border-[#EEEEF4] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F9FB] border-b border-[#EEEEF4] text-[#79768D] font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={handleSelectAll}
                      className="rounded-md border-[#D3CCDE] text-[#1F1F3B] cursor-pointer"
                    />
                  </th>
                  <th className="p-3 min-w-[180px]">Candidate / User</th>
                  <th className="p-3 min-w-[120px]">Organization</th>
                  <th className="p-3 min-w-[120px]">Department</th>
                  <th className="p-3 min-w-[100px]">Status</th>
                  <th className="p-3 min-w-[90px]">Role</th>
                  <th className="p-3 min-w-[160px]">Assigned Workflows</th>
                  <th className="p-3 min-w-[120px]">Date Assigned</th>
                  <th className="p-3 min-w-[100px]">Days Taken</th>
                  <th className="p-3 min-w-[100px]">Duration</th>
                  <th className="p-3 min-w-[120px]">Completed Date</th>
                  <th className="p-3 w-20 text-center">Actions</th>
                </tr>

                {/* SEARCH & COLUMN FILTERS ROW */}
                <tr className="bg-white border-b border-[#EEEEF4]">
                  <td className="p-2 text-center"></td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Filter name/email..."
                      value={columnFilters.nameEmail}
                      onChange={(e) =>
                        setColumnFilters({ ...columnFilters, nameEmail: e.target.value })
                      }
                      className="w-full p-1.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[11px]"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={columnFilters.organization}
                      onChange={(e) =>
                        setColumnFilters({ ...columnFilters, organization: e.target.value })
                      }
                      className="w-full p-1.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[11px] font-semibold"
                    >
                      <option value="ALL">All Orgs</option>
                      <option value="UNASSIGNED">Unassigned</option>
                      {dynamicOptions.orgs.map((org) => (
                        <option key={org} value={org}>
                          {org}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={columnFilters.department}
                      onChange={(e) =>
                        setColumnFilters({ ...columnFilters, department: e.target.value })
                      }
                      className="w-full p-1.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[11px] font-semibold"
                    >
                      <option value="ALL">All Depts</option>
                      <option value="UNASSIGNED">Unassigned</option>
                      {dynamicOptions.depts.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={columnFilters.status}
                      onChange={(e) =>
                        setColumnFilters({ ...columnFilters, status: e.target.value })
                      }
                      className="w-full p-1.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[11px] font-semibold"
                    >
                      <option value="ALL">All Status</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PENDING">Pending</option>
                      <option value="UNASSIGNED">Unassigned</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={columnFilters.role}
                      onChange={(e) =>
                        setColumnFilters({ ...columnFilters, role: e.target.value })
                      }
                      className="w-full p-1.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[11px] font-semibold"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="CANDIDATE">Candidate</option>
                      <option value="MANAGER">Manager</option>
                      <option value="EXECUTIVE">Executive</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={columnFilters.workflow}
                      onChange={(e) =>
                        setColumnFilters({ ...columnFilters, workflow: e.target.value })
                      }
                      className="w-full p-1.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[11px] font-semibold"
                    >
                      <option value="ALL">All Workflows</option>
                      <option value="NONE">No Workflows</option>
                      {availableWorkflows.map((wf) => (
                        <option key={wf.id} value={wf.title}>
                          {wf.title}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <div className="relative">
                      <button
                        onClick={() => setActiveDateAssignedMenu(!activeDateAssignedMenu)}
                        className="w-full p-1.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[10px] font-bold flex items-center justify-between"
                      >
                        <span className="truncate">
                          {columnFilters.dateAssignedMode === 'EXACT'
                            ? columnFilters.dateAssigned
                            : `${columnFilters.dateAssignedMonth}/${columnFilters.dateAssignedYear}`}
                        </span>
                        <ChevronDown className="w-3 h-3 text-[#A6A1B6]" />
                      </button>

                      {activeDateAssignedMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-[#D3CCDE] rounded-xl p-2 z-40 shadow-xl space-y-2 w-48">
                          <div className="flex border-b border-[#EEEEF4] pb-1">
                            <button
                              onClick={() =>
                                setColumnFilters({ ...columnFilters, dateAssignedMode: 'EXACT' })
                              }
                              className={`flex-1 text-[10px] font-bold p-1 rounded-lg ${
                                columnFilters.dateAssignedMode === 'EXACT'
                                  ? 'bg-[#1F1F3B] text-white'
                                  : 'text-[#79768D]'
                              }`}
                            >
                              Exact
                            </button>
                            <button
                              onClick={() =>
                                setColumnFilters({ ...columnFilters, dateAssignedMode: 'MO_YR' })
                              }
                              className={`flex-1 text-[10px] font-bold p-1 rounded-lg ${
                                columnFilters.dateAssignedMode === 'MO_YR'
                                  ? 'bg-[#1F1F3B] text-white'
                                  : 'text-[#79768D]'
                              }`}
                            >
                              Mo/Yr
                            </button>
                          </div>

                          {columnFilters.dateAssignedMode === 'EXACT' ? (
                            <select
                              value={columnFilters.dateAssigned}
                              onChange={(e) => {
                                setColumnFilters({
                                  ...columnFilters,
                                  dateAssigned: e.target.value,
                                });
                                setActiveDateAssignedMenu(false);
                              }}
                              className="w-full p-1 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[10px]"
                            >
                              <option value="ALL">All Dates</option>
                              {dynamicOptions.datesAssigned.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="space-y-1">
                              <select
                                value={columnFilters.dateAssignedMonth}
                                onChange={(e) =>
                                  setColumnFilters({
                                    ...columnFilters,
                                    dateAssignedMonth: e.target.value,
                                  })
                                }
                                className="w-full p-1 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[10px]"
                              >
                                <option value="ALL">All Months</option>
                                {MONTHS.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={columnFilters.dateAssignedYear}
                                onChange={(e) =>
                                  setColumnFilters({
                                    ...columnFilters,
                                    dateAssignedYear: e.target.value,
                                  })
                                }
                                className="w-full p-1 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[10px]"
                              >
                                <option value="ALL">All Years</option>
                                {dynamicOptions.yearsAssigned.map((y) => (
                                  <option key={y} value={y}>
                                    {y}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <select
                      value={columnFilters.durationDays}
                      onChange={(e) =>
                        setColumnFilters({ ...columnFilters, durationDays: e.target.value })
                      }
                      className="w-full p-1.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[11px]"
                    >
                      <option value="ALL">All Days</option>
                      {dynamicOptions.durationsDays.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={columnFilters.durationTime}
                      onChange={(e) =>
                        setColumnFilters({ ...columnFilters, durationTime: e.target.value })
                      }
                      className="w-full p-1.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[11px]"
                    >
                      <option value="ALL">All Hours</option>
                      {dynamicOptions.durationsTime.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <div className="relative">
                      <button
                        onClick={() => setActiveDateCompletedMenu(!activeDateCompletedMenu)}
                        className="w-full p-1.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[10px] font-bold flex items-center justify-between"
                      >
                        <span className="truncate">
                          {columnFilters.dateCompletedMode === 'EXACT'
                            ? columnFilters.dateCompleted
                            : `${columnFilters.dateCompletedMonth}/${columnFilters.dateCompletedYear}`}
                        </span>
                        <ChevronDown className="w-3 h-3 text-[#A6A1B6]" />
                      </button>

                      {activeDateCompletedMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-[#D3CCDE] rounded-xl p-2 z-40 shadow-xl space-y-2 w-48">
                          <div className="flex border-b border-[#EEEEF4] pb-1">
                            <button
                              onClick={() =>
                                setColumnFilters({ ...columnFilters, dateCompletedMode: 'EXACT' })
                              }
                              className={`flex-1 text-[10px] font-bold p-1 rounded-lg ${
                                columnFilters.dateCompletedMode === 'EXACT'
                                  ? 'bg-[#1F1F3B] text-white'
                                  : 'text-[#79768D]'
                              }`}
                            >
                              Exact
                            </button>
                            <button
                              onClick={() =>
                                setColumnFilters({ ...columnFilters, dateCompletedMode: 'MO_YR' })
                              }
                              className={`flex-1 text-[10px] font-bold p-1 rounded-lg ${
                                columnFilters.dateCompletedMode === 'MO_YR'
                                  ? 'bg-[#1F1F3B] text-white'
                                  : 'text-[#79768D]'
                              }`}
                            >
                              Mo/Yr
                            </button>
                          </div>

                          {columnFilters.dateCompletedMode === 'EXACT' ? (
                            <select
                              value={columnFilters.dateCompleted}
                              onChange={(e) => {
                                setColumnFilters({
                                  ...columnFilters,
                                  dateCompleted: e.target.value,
                                });
                                setActiveDateCompletedMenu(false);
                              }}
                              className="w-full p-1 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[10px]"
                            >
                              <option value="ALL">All Dates</option>
                              {dynamicOptions.datesCompleted.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="space-y-1">
                              <select
                                value={columnFilters.dateCompletedMonth}
                                onChange={(e) =>
                                  setColumnFilters({
                                    ...columnFilters,
                                    dateCompletedMonth: e.target.value,
                                  })
                                }
                                className="w-full p-1 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[10px]"
                              >
                                <option value="ALL">All Months</option>
                                {MONTHS.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={columnFilters.dateCompletedYear}
                                onChange={(e) =>
                                  setColumnFilters({
                                    ...columnFilters,
                                    dateCompletedYear: e.target.value,
                                  })
                                }
                                className="w-full p-1 bg-[#F7F9FB] border border-[#D3CCDE] rounded-lg text-[10px]"
                              >
                                <option value="ALL">All Years</option>
                                {dynamicOptions.yearsCompleted.map((y) => (
                                  <option key={y} value={y}>
                                    {y}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-center"></td>
                </tr>
              </thead>

              {/* TABLE BODY DISPLAYING EMPLOYEES */}
              <tbody className="divide-y divide-[#EEEEF4]">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-[#79768D]">
                      No profiles found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedEmpIds.includes(emp.id);
                    const userSteps = getUserWorkflows(emp);

                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-[#F7F9FB] transition-colors ${
                          isSelected ? 'bg-[#EEEEF4]/40' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectEmp(emp.id)}
                            className="rounded-md border-[#D3CCDE] text-[#1F1F3B] cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-semibold text-[#1F1F3B]">
                          <div>{emp.name || emp.full_name || 'Unnamed Profile'}</div>
                          <div className="text-[11px] font-mono font-normal text-[#79768D]">
                            {emp.email}
                          </div>
                        </td>
                        <td className="p-3 text-[#4C4B64] font-medium">
                          {emp.organization || <span className="text-[#A6A1B6]">—</span>}
                        </td>
                        <td className="p-3 text-[#4C4B64] font-medium">
                          {emp.department || <span className="text-[#A6A1B6]">—</span>}
                        </td>
                        <td className="p-3">
                          {userSteps.length === 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#EEEEF4] text-[#79768D] text-[10px] font-bold">
                              Unassigned
                            </span>
                          ) : userSteps.some(
                              (s) => s.status === 'APPROVED' || s.status === 'COMPLETED'
                            ) ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-[#F7F9FB] border border-[#D3CCDE] text-[#1F1F3B] text-[10px] font-bold">
                            {emp.role || 'CANDIDATE'}
                          </span>
                        </td>
                        <td className="p-3">
                          {userSteps.length === 0 ? (
                            <button
                              onClick={() => setSingleAssignTarget(emp)}
                              className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Assign Workflow
                            </button>
                          ) : (
                            <div className="space-y-1">
                              {userSteps.map((s) => (
                                <div
                                  key={s.id}
                                  className="flex items-center justify-between text-[11px] bg-[#F7F9FB] p-1.5 rounded-lg border border-[#EEEEF4]"
                                >
                                  <span className="font-semibold text-[#1F1F3B]">
                                    {s.workflows?.title || s.workflows?.name || s.task_name || s.title || 'Workflow'}
                                  </span>
                                  <button
                                    onClick={() => setDeleteWorkflowTarget(s)}
                                    className="text-[#A6A1B6] hover:text-rose-600 cursor-pointer ml-2"
                                    title="Delete Workflow Step"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-[#79768D] font-mono">
                          {userSteps
                            .map((s) => extractDateString(s.start_time || s.created_at || s.assigned_date || s.assignedDate))
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </td>
                        <td className="p-3 text-[#79768D] font-mono">
                          {userSteps
                            .map((s) =>
                              calculateDaysTaken(
                                extractDateString(s.start_time || s.created_at || s.assigned_date || s.assignedDate),
                                extractDateString(s.end_time || s.completed_date || s.completedDate)
                              )
                            )
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </td>
                        <td className="p-3 text-[#79768D] font-mono">
                          {userSteps
                            .map((s) => s.duration_hours ? `${s.duration_hours} hrs` : s.duration)
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </td>
                        <td className="p-3 text-[#79768D] font-mono">
                          {userSteps
                            .map((s) => extractDateString(s.end_time || s.completed_date || s.completedDate))
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingUser({
                                  ...emp,
                                  name: emp.name || emp.full_name || '',
                                  organization: emp.organization || '',
                                  department: emp.department || '',
                                  employee_id: emp.employee_id || '',
                                  job_title: emp.job_title || '',
                                  manager: emp.manager || '',
                                  city: emp.city || '',
                                  country: emp.country || '',
                                  gender: emp.gender || '',
                                  age: emp.age || '',
                                  years_in_company: emp.years_in_company || '',
                                  years_in_role: emp.years_in_role || '',
                                  password: emp.password || '',
                                });
                              }}
                              className="p-1.5 hover:bg-[#EEEEF4] text-[#79768D] hover:text-[#1F1F3B] rounded-lg transition-colors cursor-pointer"
                              title="Edit User Profile"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget(emp);
                                setDeleteStage(1);
                              }}
                              className="p-1.5 hover:bg-rose-50 text-[#79768D] hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
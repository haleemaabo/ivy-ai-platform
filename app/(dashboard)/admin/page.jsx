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
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);

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
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, title: '', message: '' });

  // Forms & Import States
  const [newOrgName, setNewOrgName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptOrg, setNewDeptOrg] = useState('');
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

  // Fetch Profiles with Organizations & Departments
  const fetchEmployeesFromSupabase = useCallback(async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*, organizations (name)');

      if (usersError) throw usersError;

      const { data: execCreds, error: credsError } = await supabase
        .from('executive_credentials')
        .select('user_id, assigned_password');

      if (credsError) console.warn('Could not fetch executive credentials:', credsError.message);

      const credMap = (execCreds || []).reduce((acc, curr) => {
        acc[curr.user_id] = curr.assigned_password;
        return acc;
      }, {});

      if (usersData) {
        const formatted = usersData.map((emp) => ({
          ...emp,
          name: emp.full_name || emp.name || '',
          organization: emp.organizations?.name || emp.organization || '',
          department: emp.department || '',
          password: emp.role === 'EXECUTIVE' ? credMap[emp.id] || '' : emp.password || '',
        }));
        setEmployees(formatted);
      }
    } catch (err) {
      showAlert('Error Loading Profiles', err.message);
    }
  }, [supabase]);

  const fetchApprovedWorkflows = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('workflows').select('id, title, name');
      if (error) throw error;
      if (data && data.length > 0) {
        const fetched = data.map((t) => ({
          id: t.id,
          title: t.title || t.name,
        }));
        setAvailableWorkflows(fetched);
      } else {
        setAvailableWorkflows([]);
      }
    } catch (err) {
      setAvailableWorkflows([]);
    }
  }, [supabase]);

  const fetchAllWorkflowSteps = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .select('*, workflows(id, title)');
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

  const dynamicOptions = useMemo(() => {
    const orgs = new Set(availableOrganizations);
    const depts = new Set(availableDepartments);
    const datesAssigned = new Set();
    const durationsDays = new Set();
    const durationsTime = new Set();
    const datesCompleted = new Set();
    const yearsAssigned = new Set();
    const yearsCompleted = new Set();

    employees.forEach((emp) => {
      const steps = getUserWorkflows(emp);
      steps.forEach((a) => {
        const assigned = a.assigned_date || a.assignedDate;
        const completed = a.completed_date || a.completedDate;
        if (assigned) {
          datesAssigned.add(assigned);
          const y = assigned.split('-')[0];
          if (y && y.length === 4) yearsAssigned.add(y);
        }
        if (completed) {
          datesCompleted.add(completed);
          const y = completed.split('-')[0];
          if (y && y.length === 4) yearsCompleted.add(y);
        }
        const days = calculateDaysTaken(assigned, completed);
        if (days) durationsDays.add(days);
        if (a.duration) durationsTime.add(a.duration);
      });
    });

    return {
      orgs: Array.from(orgs).sort(),
      depts: Array.from(depts).sort(),
      datesAssigned: Array.from(datesAssigned).sort(),
      durationsDays: Array.from(durationsDays).sort(),
      durationsTime: Array.from(durationsTime).sort(),
      datesCompleted: Array.from(datesCompleted).sort(),
      yearsAssigned: Array.from(yearsAssigned).sort((a, b) => Number(b) - Number(a)),
      yearsCompleted: Array.from(yearsCompleted).sort((a, b) => Number(b) - Number(a)),
    };
  }, [employees, getUserWorkflows, availableOrganizations, availableDepartments]);

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
          (s.workflows?.title || s.testTitle || '')
            .toLowerCase()
            .includes(columnFilters.workflow.toLowerCase())
        );

      let matchesDateAssigned = true;
      if (columnFilters.dateAssignedMode === 'EXACT') {
        matchesDateAssigned =
          columnFilters.dateAssigned === 'ALL' ||
          userSteps.some(
            (s) => (s.assigned_date || s.assignedDate) === columnFilters.dateAssigned
          );
      } else {
        matchesDateAssigned = userSteps.some((s) => {
          const dateStr = s.assigned_date || s.assignedDate;
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
              s.assigned_date || s.assignedDate,
              s.completed_date || s.completedDate
            ) === columnFilters.durationDays
        );

      const matchesDurationTime =
        columnFilters.durationTime === 'ALL' ||
        userSteps.some((s) => s.duration === columnFilters.durationTime);

      let matchesDateCompleted = true;
      if (columnFilters.dateCompletedMode === 'EXACT') {
        matchesDateCompleted =
          columnFilters.dateCompleted === 'ALL' ||
          userSteps.some(
            (s) => (s.completed_date || s.completedDate) === columnFilters.dateCompleted
          );
      } else {
        matchesDateCompleted = userSteps.some((s) => {
          const dateStr = s.completed_date || s.completedDate;
          if (!dateStr) return false;
          const [yr, mo] = dateStr.split('-');
          const matchesMo =
            columnFilters.dateCompletedMonth === 'ALL' ||
            mo === columnFilters.dateCompletedMonth;
          const matchesYr =
            columnFilters.dateCompletedYear === 'ALL' ||
            yr === columnFilters.dateCompletedYear;
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

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    const trimmed = newDeptName.trim();
    if (!trimmed) return;
    setCustomDepartments((prev) => [...prev, trimmed]);
    setNewDeptName('');
    setNewDeptOrg('');
    setIsAddDeptModalOpen(false);
    showAlert('Success', `Department "${trimmed}" registered.`);
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
      setIsActionsDropdownOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const targetId = deleteTarget.id;
      const targetEmail = deleteTarget.email?.toLowerCase().trim();

      if (targetId) {
        const { error: assignErr } = await supabase
          .from('workflow_steps')
          .delete()
          .eq('performer_id', targetId);
        if (assignErr) console.warn('Workflow steps deletion warning:', assignErr.message);
      }

      if (deleteTarget.role === 'EXECUTIVE') {
        const { error: credErr } = await supabase
          .from('executive_credentials')
          .delete()
          .or(`user_id.eq.${targetId},email.ilike.${targetEmail}`);
        if (credErr) console.warn('Credentials deletion warning:', credErr.message);
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
      console.error('Delete User Error:', err.message || err.details || JSON.stringify(err));
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
        `Workflow step "${deleteWorkflowTarget.title || deleteWorkflowTarget.testTitle}" has been deleted.`
      );
      setDeleteWorkflowTarget(null);
      fetchAllWorkflowSteps();
    } catch (err) {
      console.error('Delete Workflow Step Error:', err);
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
        const { error: credError } = await supabase.from('executive_credentials').upsert(
          {
            user_id: editingUser.id,
            email: editingUser.email.toLowerCase().trim(),
            assigned_password: editingUser.password,
            organization: editingUser.organization ? editingUser.organization.trim() : null,
          },
          { onConflict: 'user_id' }
        );
        if (credError) throw credError;
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

        const { error: credError } = await supabase
          .from('executive_credentials')
          .insert({
            user_id: profileData.id,
            email: trimmedEmail,
            assigned_password: newEmp.password,
            organization: trimmedOrg,
          });

        if (credError) throw credError;

        showAlert(
          'Success',
          `Executive account record created for ${trimmedEmail}. The user can log in with their pre-assigned password.`
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

        showAlert(
          'Record Created',
          `Profile for ${trimmedEmail} saved to database without sending an email.`
        );
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

    if (reader.readAsBuffer) {
      reader.readAsBuffer(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
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
    } else if (!data || data.length === 0) {
      showAlert('Database Write Blocked', 'Database accepted command but inserted 0 records.');
    } else {
      showAlert('Success', `Successfully imported ${data.length} users into Supabase.`);
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

    const newAssignments = selectedWorkflowIds.map((wfId) => {
      const wfObj = availableWorkflows.find((t) => String(t.id) === String(wfId));
      return {
        performer_id: singleAssignTarget.id,
        workflow_id: String(wfObj.id),
        title: wfObj.title,
        assigned_by: currentUser.email,
        assigned_date: new Date().toISOString().split('T')[0],
        completed_date: null,
        duration: null,
        status: 'PENDING',
      };
    });

    const { data, error } = await supabase.from('workflow_steps').insert(newAssignments).select();
    if (error) {
      showAlert('Assignment Error', error.message);
    } else if (!data || data.length === 0) {
      showAlert('Database Write Blocked', 'Assignment not saved.');
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
    const newAssignments = [];

    targetUsers.forEach((emp) => {
      bulkSelectedWorkflowIds.forEach((wfId) => {
        const wfObj = availableWorkflows.find((t) => String(t.id) === String(wfId));
        newAssignments.push({
          performer_id: emp.id,
          workflow_id: String(wfObj.id),
          title: wfObj.title,
          assigned_by: currentUser.email,
          assigned_date: new Date().toISOString().split('T')[0],
          completed_date: null,
          duration: null,
          status: 'PENDING',
        });
      });
    });

    const { data, error } = await supabase.from('workflow_steps').insert(newAssignments).select();
    if (error) {
      showAlert('Bulk Assign Error', error.message);
    } else if (!data || data.length === 0) {
      showAlert('Database Write Blocked', 'Assignments not saved.');
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
                <label className="block font-bold mb-1 text-[#1F1F3B]">Organization Name *</label>
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

      {/* Add Department Modal */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#EEEEF4]">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#1F1F3B]" />
                <h3 className="font-bold text-[#1F1F3B] text-sm">Add Department</h3>
              </div>
              <button onClick={() => setIsAddDeptModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-[#A6A1B6]" />
              </button>
            </div>
            <form onSubmit={handleAddDepartment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#1F1F3B]">Department Name *</label>
                <input
                  required
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. HR, Supply Chain, Logistics, Finance"
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#1F1F3B]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#1F1F3B]">Assign Organization</label>
                <select
                  value={newDeptOrg}
                  onChange={(e) => setNewDeptOrg(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl text-xs font-semibold text-[#1F1F3B]"
                >
                  <option value="">-- Select Organization --</option>
                  {availableOrganizations.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDeptModalOpen(false)}
                  className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#1F1F3B] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#363550] transition-colors"
                >
                  Save Department
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
                <b>"{deleteWorkflowTarget.title || deleteWorkflowTarget.testTitle}"</b>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteWorkflowTarget(null)}
                className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteWorkflowStep}
                className="w-1/2 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-rose-700 transition-colors"
              >
                Delete Workflow Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-[#EEEEF4]">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#1F1F3B]" />
                <div>
                  <h3 className="font-bold text-[#1F1F3B] text-sm">Personal Information Profile</h3>
                  <p className="text-[11px] text-[#79768D]">View and edit user profile details</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-[#A6A1B6]" />
              </button>
            </div>
            <form onSubmit={handleSavePersonalInfo} className="space-y-4 text-xs">
              <div className="bg-[#F7F9FB] p-3 rounded-xl border border-[#EEEEF4] space-y-3">
                <h4 className="font-bold text-[#1F1F3B] text-xs">Mandatory Account Info</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-[#4C4B64]">Full Name *</label>
                    <input
                      required
                      type="text"
                      value={editingUser.name || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full p-2 bg-white border border-[#D3CCDE] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[#4C4B64]">Email Address *</label>
                    <input
                      required
                      type="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full p-2 bg-white border border-[#D3CCDE] rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-[#4C4B64]">Organization</label>
                    <select
                      value={editingUser.organization || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, organization: e.target.value })}
                      className="w-full p-2 bg-white border border-[#D3CCDE] rounded-xl font-semibold text-[#1F1F3B]"
                    >
                      <option value="">-- Select Organization --</option>
                      {availableOrganizations.map((org) => (
                        <option key={org} value={org}>
                          {org}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[#4C4B64]">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Finance, HR, Supply Chain"
                      value={editingUser.department || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                      className="w-full p-2 bg-white border border-[#D3CCDE] rounded-xl font-semibold text-[#1F1F3B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-[#4C4B64]">Role *</label>
                    <select
                      value={editingUser.role || 'CANDIDATE'}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full p-2 bg-white border border-[#D3CCDE] rounded-xl font-semibold text-[#1F1F3B]"
                    >
                      <option value="CANDIDATE">CANDIDATE</option>
                      <option value="EXECUTIVE">EXECUTIVE</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="MANAGER">MANAGER</option>
                    </select>
                  </div>
                </div>

                {editingUser.role === 'EXECUTIVE' && (
                  <div>
                    <label className="block font-semibold mb-1 text-[#4C4B64]">Assigned Password</label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editingUser.password || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                        placeholder="Executive password"
                        className="w-full p-2 pr-10 bg-white border border-[#D3CCDE] rounded-xl font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A6A1B6] hover:text-[#4C4B64] cursor-pointer"
                      >
                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#EEEEF4]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#1F1F3B] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#363550] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Assign Modal */}
      {singleAssignTarget && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#EEEEF4]">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#1F1F3B]" />
                <div>
                  <h3 className="font-bold text-[#1F1F3B] text-sm">Assign Workflows</h3>
                  <p className="text-[11px] text-[#79768D]">
                    {singleAssignTarget.name} ({singleAssignTarget.email})
                  </p>
                </div>
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
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#4C4B64]">Select workflow(s) to assign:</p>
              <div className="max-h-52 overflow-y-auto border border-[#EEEEF4] rounded-xl p-3 bg-[#F7F9FB] space-y-2">
                {availableWorkflows.length === 0 ? (
                  <p className="text-xs text-[#A6A1B6] italic">No workflows available</p>
                ) : (
                  availableWorkflows.map((t) => {
                    const isChecked = selectedWorkflowIds.includes(String(t.id));
                    return (
                      <label
                        key={t.id}
                        className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-[#D3CCDE] cursor-pointer hover:border-[#1F1F3B] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const idStr = String(t.id);
                            setSelectedWorkflowIds((prev) =>
                              prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
                            );
                          }}
                          className="rounded border-[#D3CCDE] text-[#1F1F3B] focus:ring-[#1F1F3B] cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-[#1F1F3B]">{t.title}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSingleAssignTarget(null);
                  setSelectedWorkflowIds([]);
                }}
                className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED] transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={selectedWorkflowIds.length === 0}
                onClick={handleSingleUserAssignSubmit}
                className={`w-1/2 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  selectedWorkflowIds.length > 0
                    ? 'bg-[#1F1F3B] text-white hover:bg-[#363550]'
                    : 'bg-[#EEEEF4] text-[#A6A1B6] cursor-not-allowed'
                }`}
              >
                Assign ({selectedWorkflowIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#EEEEF4]">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1F1F3B]" />
                <h3 className="font-bold text-[#1F1F3B] text-sm">
                  Mass Assign ({selectedEmpIds.length} Selected)
                </h3>
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
            <div className="space-y-3">
              <p className="text-xs text-[#4C4B64]">
                Select workflow(s) to assign to all <b>{selectedEmpIds.length}</b> candidates:
              </p>
              <div className="max-h-52 overflow-y-auto border border-[#EEEEF4] rounded-xl p-3 bg-[#F7F9FB] space-y-2">
                {availableWorkflows.length === 0 ? (
                  <p className="text-xs text-[#A6A1B6] italic">No workflows available</p>
                ) : (
                  availableWorkflows.map((t) => {
                    const isChecked = bulkSelectedWorkflowIds.includes(String(t.id));
                    return (
                      <label
                        key={t.id}
                        className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-[#D3CCDE] cursor-pointer hover:border-[#1F1F3B] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const idStr = String(t.id);
                            setBulkSelectedWorkflowIds((prev) =>
                              prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
                            );
                          }}
                          className="rounded border-[#D3CCDE] text-[#1F1F3B] focus:ring-[#1F1F3B] cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-[#1F1F3B]">{t.title}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setIsBulkAssignModalOpen(false);
                  setBulkSelectedWorkflowIds([]);
                }}
                className="w-1/2 py-2.5 bg-[#EEEEF4] text-[#4C4B64] font-bold rounded-xl text-xs cursor-pointer hover:bg-[#E5E3ED] transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={bulkSelectedWorkflowIds.length === 0}
                onClick={handleBulkAssignSubmit}
                className={`w-1/2 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  bulkSelectedWorkflowIds.length > 0
                    ? 'bg-[#1F1F3B] text-white hover:bg-[#363550]'
                    : 'bg-[#EEEEF4] text-[#A6A1B6] cursor-not-allowed'
                }`}
              >
                Assign ({bulkSelectedWorkflowIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#EEEEF4]">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <h3 className="font-bold text-[#1F1F3B] text-sm">Create User Account</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-[#A6A1B6]" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#4C4B64]">Full Name</label>
                <input
                  required
                  type="text"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#4C4B64]">Email Address</label>
                <input
                  required
                  type="email"
                  value={newEmp.email}
                  onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#4C4B64]">Organization / Company</label>
                <select
                  value={newEmp.organization}
                  onChange={(e) => setNewEmp({ ...newEmp, organization: e.target.value })}
                  className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl font-semibold text-[#1F1F3B]"
                >
                  <option value="">-- Select Organization --</option>
                  {availableOrganizations.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#4C4B64]">Department</label>
                <input
                  type="text"
                  value={newEmp.department}
                  onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                  placeholder="e.g. HR, Logistics, Finance"
                  className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#4C4B64]">User Access Role</label>
                <select
                  value={newEmp.role}
                  onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value, password: '' })}
                  className="w-full p-2 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl font-semibold text-[#1F1F3B]"
                >
                  <option value="CANDIDATE">CANDIDATE</option>
                  <option value="EXECUTIVE">EXECUTIVE</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                </select>
              </div>

              {newEmp.role === 'EXECUTIVE' && (
                <div>
                  <label className="block font-bold mb-1 text-[#4C4B64]">Assigned Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showModalPassword ? 'text' : 'password'}
                      value={newEmp.password}
                      onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                      className="w-full p-2 pr-10 bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl font-mono text-xs"
                      placeholder="Enter executive password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A6A1B6] hover:text-[#4C4B64] cursor-pointer"
                    >
                      {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1F1F3B] text-white font-bold rounded-xl mt-2 cursor-pointer hover:bg-[#363550] transition-colors"
              >
                Create Account Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload CSV / Excel Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-[#1F1F3B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-[#EEEEF4]">
            <div className="flex justify-between items-center border-b border-[#EEEEF4] pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-[#1F1F3B] text-sm">Bulk Upload Candidates</h3>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setParsedUsers([]);
                  setUploadFileName('');
                  setBulkDefaultOrg('');
                }}
                className="cursor-pointer"
              >
                <X className="w-4 h-4 text-[#A6A1B6]" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-[#79768D]">
              <p>
                <b>Mandatory Header Columns: </b>
                <code className="bg-[#EEEEF4] px-1 py-0.5 rounded font-mono text-[10px] text-[#1F1F3B]">
                  Full Name, Email
                </code>
              </p>
            </div>
            <div>
              <label className="block font-bold text-xs text-[#4C4B64] mb-1">
                Default Organization (for unassigned users in file):
              </label>
              <select
                value={bulkDefaultOrg}
                onChange={(e) => setBulkDefaultOrg(e.target.value)}
                className="w-full p-2 text-xs bg-[#F7F9FB] border border-[#D3CCDE] rounded-xl font-semibold text-[#1F1F3B]"
              >
                <option value="">-- Select Organization --</option>
                {availableOrganizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>
            <div className="border-2 border-dashed border-[#D3CCDE] rounded-2xl p-6 text-center bg-[#F7F9FB] relative">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileSpreadsheet className="w-8 h-8 text-[#A6A1B6] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#1F1F3B]">
                {uploadFileName ? uploadFileName : 'Click or drop CSV / Excel spreadsheet here'}
              </p>
              <p className="text-[10px] text-[#A6A1B6] mt-1">Accepts .csv, .xlsx, or .xls formatting</p>
            </div>

            {parsedUsers.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-[#1F1F3B]">
                  <span>Parsed Candidates Preview</span>
                  <span className="text-[#1F1F3B] font-mono">{parsedUsers.length} Users Found</span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-[#EEEEF4] rounded-xl divide-y divide-[#EEEEF4] text-[11px] bg-[#F7F9FB] p-2">
                  {parsedUsers.map((u, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-[#1F1F3B]">{u.full_name}</span>
                        <span className="text-[#A6A1B6] ml-2">({u.email})</span>
                      </div>
                      <span className="font-mono text-[10px] bg-[#EEEEF4] text-[#4C4B64] px-1.5 py-0.5 rounded">
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              disabled={parsedUsers.length === 0}
              onClick={handleBulkInsert}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                parsedUsers.length > 0
                  ? 'bg-[#1F1F3B] text-white hover:bg-[#363550]'
                  : 'bg-[#EEEEF4] text-[#A6A1B6] cursor-not-allowed'
              }`}
            >
              Import {parsedUsers.length > 0 ? `${parsedUsers.length} Candidates` : 'Candidates'}
            </button>
          </div>
        </div>
      )}

      {/* Header Container */}
      <header className="bg-white border-b border-[#EEEEF4] sticky top-0 z-30">
        <div className="w-full max-w-[98%] mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/ivy-logo-dark.png"
              alt="Ivy & Company Logo"
              width={160}
              height={48}
              style={{ width: 'auto', height: '48px' }}
              priority
            />
            <div className="h-8 w-[1px] bg-[#EEEEF4]" />
            <div>
              <h1 className="text-sm font-semibold text-[#1F1F3B] leading-tight">Admin Portal</h1>
              <p className="text-[10px] font-bold text-[#A6A1B6] uppercase tracking-widest">
                ENTERPRISE MANAGEMENT
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 border border-[#EEEEF4] rounded-full text-xs text-[#4C4B64] bg-[#F7F9FB]">
              <Usericon className="w-3.5 h-3.5 text-[#A6A1B6]" />
              <span>{currentUser.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-[#A6A1B6] hover:text-[#1F1F3B] transition-colors cursor-pointer rounded-lg border border-[#EEEEF4]"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[98%] mx-auto px-4 py-8 space-y-6 flex-1">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-[#1F1F3B] tracking-tight">
            Welcome, {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
          </h1>
          <p className="text-sm font-normal text-[#79768D]">
            Manage employees, workflows, and organizational insights.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EEEEF4] shadow-xs">
            <div>
              <h2 className="text-base font-bold text-[#1F1F3B]">User Directory & Assignments</h2>
              <p className="text-xs text-[#79768D]">Live directory synced with Supabase database.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setIsAddDeptModalOpen(true)}
                className="px-4 py-2 bg-[#F3F4F8] text-[#1F1F3B] border border-[#D3CCDE] hover:bg-[#E5E3ED] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Briefcase className="w-4 h-4 text-[#1F1F3B]" />
                <span>Add Department</span>
              </button>
              <button
                onClick={() => setIsAddOrgModalOpen(true)}
                className="px-4 py-2 bg-[#F3F4F8] text-[#1F1F3B] border border-[#D3CCDE] hover:bg-[#E5E3ED] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Building2 className="w-4 h-4 text-[#1F1F3B]" />
                <span>Add Organization</span>
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload CSV / Excel</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-[#1F1F3B] text-white rounded-xl flex items-center gap-2 cursor-pointer font-bold text-xs hover:bg-[#363550] transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create User Account</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EEEEF4] shadow-xs">
            {/* Table Controls Header */}
            <div className="p-3.5 border-b border-[#EEEEF4] flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#A6A1B6]" />
                <span className="text-xs font-bold text-[#1F1F3B]">Directory Table Controls</span>
              </div>
              <div className="flex items-center gap-3">
                {isAnyFilterActive && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-[#1F1F3B] hover:underline font-semibold cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                )}
                {selectedEmpIds.length > 0 && (
                  <span className="text-xs font-semibold text-[#1F1F3B] bg-[#E5E3ED] px-2.5 py-1 rounded-lg border border-[#D3CCDE]">
                    {selectedEmpIds.length} Selected
                  </span>
                )}
                <div className="relative">
                  <button
                    disabled={selectedEmpIds.length === 0}
                    onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                      selectedEmpIds.length > 0
                        ? 'bg-[#1F1F3B] text-white border-transparent hover:bg-[#363550]'
                        : 'bg-[#EEEEF4] text-[#A6A1B6] border-[#D3CCDE] cursor-not-allowed'
                    }`}
                  >
                    <span>Actions</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {isActionsDropdownOpen && selectedEmpIds.length > 0 && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-[#D3CCDE] rounded-xl shadow-xl z-20 py-1">
                      {selectedEmpIds.length === 1 && (
                        <>
                          <button
                            onClick={handleOpenEditModalForSelected}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-[#1F1F3B] hover:bg-[#F7F9FB] flex items-center gap-2 cursor-pointer border-b border-[#EEEEF4]"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#1F1F3B]" />
                            <span>Edit Personal Information</span>
                          </button>
                          <button
                            onClick={() => {
                              const target = employees.find((e) => e.id === selectedEmpIds[0]);
                              if (target) {
                                setDeleteTarget(target);
                                setDeleteStage(1);
                                setIsActionsDropdownOpen(false);
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-b border-[#EEEEF4]"
                          >
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete User</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setIsActionsDropdownOpen(false);
                          setIsBulkAssignModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-[#1F1F3B] hover:bg-[#F7F9FB] flex items-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-[#1F1F3B]" />
                        <span>Assign Workflow ({selectedEmpIds.length})</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-[#A6A1B6]">
                  {filteredEmployees.length} Records
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-[#F7F9FB] border-b border-[#EEEEF4] text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
                    <th className="py-3 px-2.5 w-8 align-top">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={handleSelectAll}
                        className="rounded border-[#D3CCDE] text-[#1F1F3B] focus:ring-[#1F1F3B] cursor-pointer mt-1"
                      />
                    </th>
                    <th className="py-2.5 px-2.5 align-top min-w-[160px]">
                      <div className="mb-1.5">NAME/EMAIL</div>
                      <div className="relative">
                        <Search className="w-3 h-3 text-[#A6A1B6] absolute left-2 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Filter name/email..."
                          value={columnFilters.nameEmail}
                          onChange={(e) =>
                            setColumnFilters({ ...columnFilters, nameEmail: e.target.value })
                          }
                          className="w-full pl-6 pr-2 py-1 bg-white border border-[#D3CCDE] rounded-lg text-[11px] font-normal normal-case focus:outline-none focus:ring-1 focus:ring-[#1F1F3B]"
                        />
                      </div>
                    </th>
                    <th className="py-2.5 px-2.5 align-top min-w-[130px]">
                      <div className="mb-1.5">ORGANIZATION</div>
                      <select
                        value={columnFilters.organization}
                        onChange={(e) =>
                          setColumnFilters({ ...columnFilters, organization: e.target.value })
                        }
                        className="w-full p-1 bg-white border border-[#D3CCDE] rounded-lg text-[11px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                      >
                        <option value="ALL">All Orgs</option>
                        <option value="UNASSIGNED">Unassigned</option>
                        {dynamicOptions.orgs.map((org) => (
                          <option key={org} value={org}>
                            {org}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="py-2.5 px-2.5 align-top min-w-[130px]">
                      <div className="mb-1.5">DEPARTMENT</div>
                      <select
                        value={columnFilters.department}
                        onChange={(e) =>
                          setColumnFilters({ ...columnFilters, department: e.target.value })
                        }
                        className="w-full p-1 bg-white border border-[#D3CCDE] rounded-lg text-[11px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                      >
                        <option value="ALL">All Depts</option>
                        <option value="UNASSIGNED">Unassigned</option>
                        {dynamicOptions.depts.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="py-2.5 px-2.5 align-top min-w-[120px]">
                      <div className="mb-1.5">STATUS</div>
                      <select
                        value={columnFilters.status}
                        onChange={(e) =>
                          setColumnFilters({ ...columnFilters, status: e.target.value })
                        }
                        className="w-full p-1 bg-white border border-[#D3CCDE] rounded-lg text-[11px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING">Pending</option>
                        <option value="UNASSIGNED">Unassigned</option>
                      </select>
                    </th>
                    <th className="py-2.5 px-2.5 align-top min-w-[110px]">
                      <div className="mb-1.5">ROLE</div>
                      <select
                        value={columnFilters.role}
                        onChange={(e) =>
                          setColumnFilters({ ...columnFilters, role: e.target.value })
                        }
                        className="w-full p-1 bg-white border border-[#D3CCDE] rounded-lg text-[11px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                      >
                        <option value="ALL">All Roles</option>
                        <option value="CANDIDATE">Candidate</option>
                        <option value="EXECUTIVE">Executive</option>
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                      </select>
                    </th>
                    <th className="py-2.5 px-2.5 align-top min-w-[180px]">
                      <div className="mb-1.5">ASSIGNED WORKFLOWS</div>
                      <select
                        value={columnFilters.workflow}
                        onChange={(e) =>
                          setColumnFilters({ ...columnFilters, workflow: e.target.value })
                        }
                        className="w-full p-1 bg-white border border-[#D3CCDE] rounded-lg text-[11px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer truncate"
                      >
                        <option value="ALL">All Workflows</option>
                        <option value="NONE">No Workflows Assigned</option>
                        {availableWorkflows.map((t) => (
                          <option key={t.id} value={t.title}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="py-2.5 px-2.5 align-top min-w-[150px] relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <span>DATE ASSIGNED</span>
                        <button
                          onClick={() => {
                            setActiveDateAssignedMenu(!activeDateAssignedMenu);
                            setActiveDateCompletedMenu(false);
                            setColumnFilters((prev) => ({
                              ...prev,
                              dateAssignedMode:
                                prev.dateAssignedMode === 'EXACT' ? 'MONTH_YEAR' : 'EXACT',
                            }));
                          }}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            columnFilters.dateAssignedMode === 'MONTH_YEAR'
                              ? 'bg-[#E5E3ED] text-[#1F1F3B]'
                              : 'text-[#A6A1B6] hover:text-[#1F1F3B]'
                          }`}
                          title="Advanced Date Options (Month/Year)"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                        </button>
                      </div>
                      {columnFilters.dateAssignedMode === 'EXACT' ? (
                        <select
                          value={columnFilters.dateAssigned}
                          onChange={(e) =>
                            setColumnFilters({ ...columnFilters, dateAssigned: e.target.value })
                          }
                          className="w-full p-1 bg-white border border-[#D3CCDE] rounded-lg text-[11px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                        >
                          <option value="ALL">All Dates</option>
                          {dynamicOptions.datesAssigned.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1">
                          <select
                            value={columnFilters.dateAssignedMonth}
                            onChange={(e) =>
                              setColumnFilters({
                                ...columnFilters,
                                dateAssignedMonth: e.target.value,
                              })
                            }
                            className="w-1/2 p-1 bg-white border border-[#D3CCDE] rounded-lg text-[10px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                          >
                            <option value="ALL">Mo: All</option>
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
                            className="w-1/2 p-1 bg-white border border-[#D3CCDE] rounded-lg text-[10px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                          >
                            <option value="ALL">Yr: All</option>
                            {dynamicOptions.yearsAssigned.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </th>
                    <th className="py-2.5 px-2.5 align-top min-w-[120px]">
                      <div className="mb-1.5">DURATION (DAYS)</div>
                      <select
                        value={columnFilters.durationDays}
                        onChange={(e) =>
                          setColumnFilters({ ...columnFilters, durationDays: e.target.value })
                        }
                        className="w-full p-1 bg-white border border-[#D3CCDE] rounded-lg text-[11px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                      >
                        <option value="ALL">All Durations</option>
                        {dynamicOptions.durationsDays.map((dd) => (
                          <option key={dd} value={dd}>
                            {dd}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="py-2.5 px-2.5 align-top min-w-[120px]">
                      <div className="mb-1.5">DURATION (TIME)</div>
                      <select
                        value={columnFilters.durationTime}
                        onChange={(e) =>
                          setColumnFilters({ ...columnFilters, durationTime: e.target.value })
                        }
                        className="w-full p-1 bg-white border border-[#D3CCDE] rounded-lg text-[11px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                      >
                        <option value="ALL">All Times</option>
                        {dynamicOptions.durationsTime.map((dt) => (
                          <option key={dt} value={dt}>
                            {dt}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="py-2.5 px-2.5 align-top min-w-[150px] relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <span>DATE COMPLETED</span>
                        <button
                          onClick={() => {
                            setActiveDateCompletedMenu(!activeDateCompletedMenu);
                            setActiveDateAssignedMenu(false);
                            setColumnFilters((prev) => ({
                              ...prev,
                              dateCompletedMode:
                                prev.dateCompletedMode === 'EXACT' ? 'MONTH_YEAR' : 'EXACT',
                            }));
                          }}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            columnFilters.dateCompletedMode === 'MONTH_YEAR'
                              ? 'bg-[#E5E3ED] text-[#1F1F3B]'
                              : 'text-[#A6A1B6] hover:text-[#1F1F3B]'
                          }`}
                          title="Advanced Date Options (Month/Year)"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                        </button>
                      </div>
                      {columnFilters.dateCompletedMode === 'EXACT' ? (
                        <select
                          value={columnFilters.dateCompleted}
                          onChange={(e) =>
                            setColumnFilters({ ...columnFilters, dateCompleted: e.target.value })
                          }
                          className="w-full p-1 bg-white border border-[#D3CCDE] rounded-lg text-[11px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                        >
                          <option value="ALL">All Dates</option>
                          {dynamicOptions.datesCompleted.map((dc) => (
                            <option key={dc} value={dc}>
                              {dc}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1">
                          <select
                            value={columnFilters.dateCompletedMonth}
                            onChange={(e) =>
                              setColumnFilters({
                                ...columnFilters,
                                dateCompletedMonth: e.target.value,
                              })
                            }
                            className="w-1/2 p-1 bg-white border border-[#D3CCDE] rounded-lg text-[10px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                          >
                            <option value="ALL">Mo: All</option>
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
                            className="w-1/2 p-1 bg-white border border-[#D3CCDE] rounded-lg text-[10px] font-semibold text-[#1F1F3B] normal-case outline-none cursor-pointer"
                          >
                            <option value="ALL">Yr: All</option>
                            {dynamicOptions.yearsCompleted.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </th>
                    <th className="py-3 px-2.5 align-top min-w-[120px]">DASHBOARD</th>
                    <th className="py-3 px-2.5 text-right align-top min-w-[120px]">ASSIGN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEF4] text-xs">
                  {filteredEmployees.map((emp) => {
                    const userSteps = getUserWorkflows(emp);
                    const completedSteps = userSteps.filter(
                      (a) => a.status === 'COMPLETED' || a.status === 'APPROVED'
                    );
                    const isSelected = selectedEmpIds.includes(emp.id);
                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-[#F7F9FB] transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#EEEEF4]/60' : ''
                        }`}
                      >
                        <td className="py-3 px-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectEmp(emp.id)}
                            className="rounded border-[#D3CCDE] text-[#1F1F3B] focus:ring-[#1F1F3B] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-2.5">
                          <div className="font-bold text-[#1F1F3B] leading-tight">
                            {emp.name || 'Unnamed User'}
                          </div>
                          <div className="text-[10px] text-[#A6A1B6] font-mono">{emp.email}</div>
                        </td>
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          {emp.organization && emp.organization.trim() ? (
                            <span className="px-1.5 py-0.5 bg-[#EEEEF4] text-[#1F1F3B] font-semibold rounded border border-[#D3CCDE] text-[10px]">
                              {emp.organization.trim()}
                            </span>
                          ) : (
                            <span className="text-[#A6A1B6] italic text-[10px]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          {emp.department && emp.department.trim() ? (
                            <span className="px-1.5 py-0.5 bg-[#EEEEF4] text-[#1F1F3B] font-semibold rounded border border-[#D3CCDE] text-[10px]">
                              {emp.department.trim()}
                            </span>
                          ) : (
                            <span className="text-[#A6A1B6] italic text-[10px]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          {userSteps.length === 0 ? (
                            <span className="px-1.5 py-0.5 bg-[#EEEEF4] text-[#A6A1B6] font-bold rounded text-[10px]">
                              Unassigned
                            </span>
                          ) : userSteps.some(
                              (a) => a.status === 'COMPLETED' || a.status === 'APPROVED'
                            ) ? (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                              Completed
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                              emp.role === 'EXECUTIVE'
                                ? 'bg-purple-100 text-purple-700'
                                : emp.role === 'ADMIN'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-[#EEEEF4] text-[#1F1F3B]'
                            }`}
                          >
                            {emp.role || 'CANDIDATE'}
                          </span>
                        </td>
                        <td className="py-3 px-2.5">
                          <div className="space-y-1.5">
                            {userSteps.length === 0 ? (
                              <span className="text-[#A6A1B6] text-[10px]">No workflows assigned</span>
                            ) : (
                              userSteps.map((asg) => (
                                <div key={asg.id} className="flex items-center justify-between gap-2 group">
                                  <span className="font-semibold text-[#1F1F3B] text-[11px]">
                                    {asg.workflows?.title || asg.title || asg.testTitle}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteWorkflowTarget(asg);
                                    }}
                                    className="text-[#A6A1B6] hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer"
                                    title="Delete this workflow step"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2.5 text-[#4C4B64] font-mono text-[10px] whitespace-nowrap">
                          {userSteps.length === 0 ? (
                            <span className="text-[#A6A1B6] italic">N/A</span>
                          ) : (
                            userSteps.map((asg) => (
                              <div key={asg.id}>{asg.assigned_date || asg.assignedDate || 'N/A'}</div>
                            ))
                          )}
                        </td>
                        <td className="py-3 px-2.5 font-mono text-[10px] whitespace-nowrap">
                          {userSteps.length === 0 ? (
                            <span className="text-[#A6A1B6] italic">N/A</span>
                          ) : (
                            userSteps.map((asg) => {
                              const daysTaken = calculateDaysTaken(
                                asg.assigned_date || asg.assignedDate,
                                asg.completed_date || asg.completedDate
                              );
                              return (
                                <div key={asg.id}>
                                  {daysTaken ? (
                                    <span className="px-1 py-0.5 bg-[#E5E3ED] text-[#1F1F3B] font-bold rounded text-[9px]">
                                      {daysTaken}
                                    </span>
                                  ) : (
                                    <span className="text-[#A6A1B6] italic">N/A</span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-[#4C4B64] font-mono text-[10px] whitespace-nowrap">
                          {userSteps.length === 0 ? (
                            <span className="text-[#A6A1B6] italic">N/A</span>
                          ) : (
                            userSteps.map((asg) => <div key={asg.id}>{asg.duration || 'N/A'}</div>)
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-[#4C4B64] font-mono text-[10px] whitespace-nowrap">
                          {userSteps.length === 0 ? (
                            <span className="text-[#A6A1B6] italic">N/A</span>
                          ) : (
                            userSteps.map((asg) => {
                              const date = asg.completed_date || asg.completedDate;
                              return (
                                <div key={asg.id}>
                                  {date ? (
                                    <span className="text-emerald-700 font-bold">{date}</span>
                                  ) : (
                                    <span className="text-amber-600 italic">Pending</span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </td>
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          {completedSteps.length > 0 ? (
                            <div className="space-y-1">
                              {completedSteps.map((asg, index) => (
                                <button
                                  key={asg.id}
                                  onClick={() => {
                                    if (asg.id) {
                                      router.push('/dashboard/' + encodeURIComponent(asg.id));
                                    } else {
                                      showAlert('Missing Identifier', 'Workflow missing valid ID.');
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-[#1F1F3B] hover:bg-[#363550] text-white font-bold rounded-lg text-[10px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                >
                                  <LayoutGrid className="w-3 h-3 text-[#D3CCDE]" />
                                  <span>
                                    Open Dashboard{completedSteps.length > 1 ? ` #${index + 1}` : ''}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#A6A1B6] font-mono text-xs">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSingleAssignTarget({
                                id: emp.id,
                                email: emp.email,
                                name: emp.name,
                              });
                              setSelectedWorkflowIds([]);
                            }}
                            className="px-2.5 py-1 bg-[#1F1F3B] hover:bg-[#363550] text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            title="Assign Workflow"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Assign Workflow</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
import React, { useState, useEffect, useMemo, FormEvent, ChangeEvent } from 'react';
import {
  FileText,
  Inbox,
  Send,
  Search,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  X,
  Database,
  RefreshCw,
  FileSpreadsheet,
  BookOpen,
  Info,
  Layers,
  Settings,
  Check,
  Copy,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { DocumentRecord, DocType, DocUrgency, DocStatus, StatsSummary, GoogleUser } from './types';
import { initialSampleRecords } from './sampleData';

const COMMON_SENDERS_INCOMING = [
  'สำนักงานปลัดกระทรวงมหาดไทย',
  'กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม',
  'สำนักงานสาธารณสุขจังหวัด',
  'มหาวิทยาลัยเทคโนโลยีราชมงคล',
  'กรมบัญชีกลาง',
  'สำนักงบประมาณ แผนกวิเคราะห์งบประมาณ',
  'กรมที่ดิน จังหวัดเชียงใหม่'
];

const COMMON_RECEIVERS_INCOMING = [
  'กองกลาง ฝ่ายบริหารงานทั่วไป',
  'ฝ่ายอนามัยและสิ่งแวดล้อม',
  'กองบริหารทรัพยากรบุคคล',
  'ฝ่ายจัดการสิ่งแวดล้อม',
  'ฝ่ายแผนงานและงบประมาณ',
  'กองคลัง แผนกบัญชี',
  'ฝ่ายพัฒนาชุมชน'
];

export default function App() {
  // Google User Authentication State
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(() => {
    try {
      const saved = localStorage.getItem('google_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Save user session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('google_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('google_user');
    }
  }, [currentUser]);

  // Load initial data from localStorage if available, otherwise use initialSampleRecords
  const [records, setRecords] = useState<DocumentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('doc_records');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load records from localStorage', e);
    }
    return initialSampleRecords;
  });

  // Save records to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('doc_records', JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save records to localStorage', e);
    }
  }, [records]);

  // App navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'add' | 'settings'>('dashboard');

  // Form Editing State
  const [editingRecord, setEditingRecord] = useState<DocumentRecord | null>(null);

  // Form Fields State
  const [formType, setFormType] = useState<DocType>('incoming');
  const [formRegNo, setFormRegNo] = useState('');
  const [formDocNo, setFormDocNo] = useState('');
  const [formDocDate, setFormDocDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formRegDate, setFormRegDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formRegTime, setFormRegTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [formSender, setFormSender] = useState('');
  const [formReceiver, setFormReceiver] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formUrgency, setFormUrgency] = useState<DocUrgency>('normal');
  const [formStatus, setFormStatus] = useState<DocStatus>('pending');
  const [formNotes, setFormNotes] = useState('');
  const [formRegisteredBy, setFormRegisteredBy] = useState('');

  // Auto pre-fill registrant if logged in
  useEffect(() => {
    if (currentUser && !formRegisteredBy) {
      setFormRegisteredBy(currentUser.name);
    }
  }, [currentUser]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | DocType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | DocStatus>('all');
  const [filterUrgency, setFilterUrgency] = useState<'all' | DocUrgency>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Selected Record for detailed modal view
  const [selectedRecord, setSelectedRecord] = useState<DocumentRecord | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };



  // OAuth Listener for popup response
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'OAUTH_AUTH_SUCCESS') {
        setCurrentUser(event.data.user);
        showToast(`ยินดีต้อนรับคุณ ${event.data.user.name} เข้าสู่ระบบด้วย Google!`, 'success');
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) throw new Error('Failed to fetch auth url');
      const data = await res.json();
      
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      window.open(
        data.url,
        'google_oauth',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
      );
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถเชื่อมโยงระบบ Google Login ได้ในขณะนี้', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  };

  // Helper: auto-generate/suggest next registration number
  // e.g. "005/2569" based on the current year and selected type
  const suggestNextRegNo = (type: DocType, currentRegDate: string) => {
    const yearTh = parseInt(currentRegDate.split('-')[0] || '2026') + 543; // Thai Buddhist year
    const sameTypeRecordsInYear = records.filter(r => {
      if (r.type !== type) return false;
      const rYearTh = parseInt(r.regDate.split('-')[0]) + 543;
      return rYearTh === yearTh;
    });

    let maxNum = 0;
    sameTypeRecordsInYear.forEach(r => {
      const match = r.regNo.match(/^(\d+)\//);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextNum = maxNum + 1;
    const paddedNum = String(nextNum).padStart(3, '0');
    return `${paddedNum}/${yearTh}`;
  };

  // Trigger suggest next reg no when entering Add mode or changing type/date
  const handleAutoFillRegNo = () => {
    const suggested = suggestNextRegNo(formType, formRegDate);
    setFormRegNo(suggested);
    showToast(`แนะนำเลขทะเบียนใหม่: ${suggested}`, 'info');
  };

  // Handle Edit button click
  const startEdit = (record: DocumentRecord) => {
    setEditingRecord(record);
    setFormType(record.type);
    setFormRegNo(record.regNo);
    setFormDocNo(record.docNo);
    setFormDocDate(record.docDate);
    setFormRegDate(record.regDate);
    setFormRegTime(record.regTime || '12:00');
    setFormSender(record.sender);
    setFormReceiver(record.receiver);
    setFormSubject(record.subject);
    setFormOwner(record.owner);
    setFormUrgency(record.urgency);
    setFormStatus(record.status);
    setFormNotes(record.notes);
    setFormRegisteredBy(record.registeredBy || '');
    setActiveTab('add');
    setSelectedRecord(null);
  };

  // Handle setting record back to standard/empty when opening Add tab manually
  const resetFormFields = () => {
    setEditingRecord(null);
    setFormType('incoming');
    setFormDocNo('');
    setFormSender('');
    setFormReceiver('');
    setFormSubject('');
    setFormOwner('');
    setFormUrgency('normal');
    setFormStatus('pending');
    setFormNotes('');
    const today = new Date().toISOString().split('T')[0];
    setFormDocDate(today);
    setFormRegDate(today);
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setFormRegTime(currentTime);
    setFormRegisteredBy(currentUser ? currentUser.name : '');

    // Auto-fill initial suggestion
    const suggested = suggestNextRegNo('incoming', today);
    setFormRegNo(suggested);
  };

  // Trigger auto-suggest regNo when formType or formRegDate changes in creation mode
  useEffect(() => {
    if (!editingRecord) {
      setFormRegNo(suggestNextRegNo(formType, formRegDate));
    }
  }, [formType, formRegDate, editingRecord]);

  // Handle form submit
  const handleSaveRecord = (e: FormEvent) => {
    e.preventDefault();

    if (!formRegNo.trim() || !formDocNo.trim() || !formSubject.trim() || !formSender.trim() || !formReceiver.trim()) {
      showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (เลขทะเบียน, เลขที่หนังสือ, เรื่อง, ผู้ส่ง, ผู้รับ)', 'error');
      return;
    }

    if (editingRecord) {
      // Update existing record
      const updatedRecords = records.map(r => 
        r.id === editingRecord.id 
          ? {
              ...r,
              type: formType,
              regNo: formRegNo,
              docNo: formDocNo,
              docDate: formDocDate,
              regDate: formRegDate,
              regTime: formRegTime,
              sender: formSender,
              receiver: formReceiver,
              subject: formSubject,
              owner: formOwner,
              urgency: formUrgency,
              status: formStatus,
              notes: formNotes,
              registeredBy: formRegisteredBy,
            }
          : r
      );
      setRecords(updatedRecords);
      showToast('อัปเดตข้อมูลเอกสารเรียบร้อยแล้ว');
    } else {
      // Create new record
      const newRecord: DocumentRecord = {
        id: 'doc_' + Date.now(),
        type: formType,
        regNo: formRegNo,
        docNo: formDocNo,
        docDate: formDocDate,
        regDate: formRegDate,
        regTime: formRegTime,
        sender: formSender,
        receiver: formReceiver,
        subject: formSubject,
        owner: formOwner,
        urgency: formUrgency,
        status: formStatus,
        notes: formNotes,
        registeredBy: formRegisteredBy || (currentUser ? currentUser.name : undefined),
        createdAt: new Date().toISOString()
      };
      setRecords([newRecord, ...records]);
      showToast('ลงทะเบียนรับ-ส่งเอกสารสำเร็จ');
    }

    // Reset form and return to records log
    resetFormFields();
    setActiveTab('records');
  };

  // Handle delete
  const handleDeleteRecord = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบเอกสารลงทะเบียนนี้? ข้อมูลจะไม่สามารถกู้คืนได้')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      showToast('ลบรายการเอกสารเรียบร้อยแล้ว', 'info');
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    }
  };

  // Calculate statistics summary
  const stats = useMemo<StatsSummary>(() => {
    const summary: StatsSummary = {
      total: records.length,
      incoming: 0,
      outgoing: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      cancelled: 0,
      urgentCount: 0
    };

    records.forEach(r => {
      if (r.type === 'incoming') summary.incoming++;
      else summary.outgoing++;

      if (r.status === 'completed') summary.completed++;
      else if (r.status === 'in_progress') summary.inProgress++;
      else if (r.status === 'pending') summary.pending++;
      else if (r.status === 'cancelled') summary.cancelled++;

      if (r.urgency === 'urgent' || r.urgency === 'very_urgent') {
        summary.urgentCount++;
      }
    });

    return summary;
  }, [records]);

  // Filtered Records calculation
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search text filter
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchesQuery = 
          r.subject.toLowerCase().includes(query) ||
          r.docNo.toLowerCase().includes(query) ||
          r.regNo.toLowerCase().includes(query) ||
          r.sender.toLowerCase().includes(query) ||
          r.receiver.toLowerCase().includes(query) ||
          r.owner.toLowerCase().includes(query) ||
          (r.registeredBy && r.registeredBy.toLowerCase().includes(query)) ||
          (r.regTime && r.regTime.includes(query)) ||
          r.notes.toLowerCase().includes(query);
        
        if (!matchesQuery) return false;
      }

      // Type Filter
      if (filterType !== 'all' && r.type !== filterType) return false;

      // Status Filter
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;

      // Urgency Filter
      if (filterUrgency !== 'all' && r.urgency !== filterUrgency) return false;

      // Start Date Filter (on register date)
      if (filterStartDate && r.regDate < filterStartDate) return false;

      // End Date Filter
      if (filterEndDate && r.regDate > filterEndDate) return false;

      return true;
    });
  }, [records, searchQuery, filterType, filterStatus, filterUrgency, filterStartDate, filterEndDate]);

  // Reset all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterStatus('all');
    setFilterUrgency('all');
    setFilterStartDate('');
    setFilterEndDate('');
    showToast('ล้างตัวกรองทั้งหมดแล้ว', 'info');
  };

  // Pagination slice
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus, filterUrgency, filterStartDate, filterEndDate]);

  // CSV Export function with UTF-8 BOM for Thai Excel compatibility
  const exportCSV = () => {
    const headers = [
      'ประเภท',
      'เลขทะเบียนรับ-ส่ง',
      'เลขที่เอกสาร/หนังสือ',
      'ลงวันที่ในเอกสาร',
      'วันที่ลงทะเบียนรับ/ส่ง',
      'จาก (ผู้ส่ง)',
      'ถึง (ผู้รับ)',
      'เรื่อง',
      'ผู้รับผิดชอบ',
      'ความเร่งด่วน',
      'สถานะการดำเนินงาน',
      'หมายเหตุ'
    ];

    const rows = filteredRecords.map(r => [
      r.type === 'incoming' ? 'รับ' : 'ส่ง',
      r.regNo,
      r.docNo,
      r.docDate,
      r.regDate,
      r.sender,
      r.receiver,
      r.subject,
      r.owner,
      r.urgency === 'very_urgent' ? 'ด่วนที่สุด' : r.urgency === 'urgent' ? 'ด่วน' : 'ปกติ',
      r.status === 'completed' 
        ? 'ดำเนินการเสร็จสิ้น' 
        : r.status === 'in_progress' 
        ? 'กำลังดำเนินการ' 
        : r.status === 'pending' 
        ? 'รอดำเนินการ' 
        : 'ยกเลิก',
      r.notes
    ]);

    // UTF-8 BOM to prevent Thai garbled text in Excel
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `สมุดทะเบียนเอกสาร_ส่งออก_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`ส่งออกข้อมูลเรียบร้อย (${filteredRecords.length} รายการ)`);
  };

  // Export JSON backup
  const exportJSONBackup = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `backup_สมุดรับส่งเอกสาร_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('ดาวน์โหลดไฟล์สำรองข้อมูล JSON สำเร็จ');
  };

  // Import JSON Backup
  const handleImportJSONBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Basic validation of fields
          const isValid = parsed.every(item => 
            item.id && 
            item.type && 
            item.regNo && 
            item.docNo && 
            item.docDate && 
            item.regDate && 
            item.sender && 
            item.receiver && 
            item.subject
          );

          if (isValid) {
            setRecords(parsed);
            showToast(`กู้คืนข้อมูลสำเร็จแล้ว ${parsed.length} รายการ`, 'success');
            setActiveTab('records');
          } else {
            showToast('ไฟล์สำรองรูปแบบไม่ถูกต้อง ข้อมูลฟิลด์หลักบางรายการขาดหาย', 'error');
          }
        } else {
          showToast('ไฟล์สำรองไม่ตรงตามเกณฑ์ของระบบ ต้องเป็นอาร์เรย์ของเอกสาร', 'error');
        }
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON กรุณาตรวจสอบอีกครั้ง', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Reset to default sample records
  const handleResetToDefault = () => {
    if (confirm('คุณกำลังจะกู้คืนข้อมูลตัวอย่างเริ่มต้น ข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่ ดำเนินการต่อหรือไม่?')) {
      setRecords(initialSampleRecords);
      showToast('รีเซ็ตข้อมูลเป็นชุดตัวอย่างเริ่มต้นเรียบร้อยแล้ว', 'info');
      setActiveTab('dashboard');
    }
  };

  // Clear all data
  const handleClearAllData = () => {
    if (confirm('คำเตือน: คุณต้องการลบฐานข้อมูลเอกสารทั้งหมดหรือไม่? ข้อมูลทั้งหมดในหน่วยความจำจะหายไปทันที')) {
      setRecords([]);
      showToast('ลบข้อมูลทั้งหมดในระบบเรียบร้อยแล้ว', 'error');
      setActiveTab('dashboard');
    }
  };

  // Copy document details to clipboard for convenient sharing
  const copyRecordToClipboard = (r: DocumentRecord) => {
    const typeLabel = r.type === 'incoming' ? 'หนังสือรับ' : 'หนังสือส่ง';
    const urgencyLabel = r.urgency === 'very_urgent' ? 'ด่วนที่สุด' : r.urgency === 'urgent' ? 'ด่วน' : 'ปกติ';
    const statusLabel = r.status === 'completed' ? 'ดำเนินการเสร็จสิ้น' : r.status === 'in_progress' ? 'กำลังดำเนินการ' : r.status === 'pending' ? 'รอดำเนินการ' : 'ยกเลิก';
    
    const text = `📌 บันทึกข้อมูลทะเบียนเอกสาร [${typeLabel}]
เลขทะเบียน: ${r.regNo}
เลขที่หนังสือ: ${r.docNo}
ลงวันที่ในหนังสือ: ${r.docDate}
วันที่ลงทะเบียน: ${r.regDate}
จาก: ${r.sender}
ถึง: ${r.receiver}
เรื่อง: ${r.subject}
ผู้รับผิดชอบ: ${r.owner || '-'}
ความเร่งด่วน: ${urgencyLabel}
สถานะ: ${statusLabel}
หมายเหตุ: ${r.notes || '-'}
---------------------------------`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('คัดลอกรายละเอียดไปยังคลิปบอร์ดแล้ว', 'success');
    }).catch(() => {
      showToast('ล้มเหลวในการคัดลอกข้อมูล', 'error');
    });
  };

  // Quick statistics calculation for custom bar charts (volumes by day)
  const registrationChartData = useMemo(() => {
    // Collect unique register dates from past 7 days or matching items
    const dateCounts: Record<string, { incoming: number; outgoing: number }> = {};
    
    // Get last 7 calendar days to show on chart
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      dateCounts[dateString] = { incoming: 0, outgoing: 0 };
    }

    records.forEach(r => {
      if (dateCounts[r.regDate]) {
        if (r.type === 'incoming') dateCounts[r.regDate].incoming++;
        else dateCounts[r.regDate].outgoing++;
      }
    });

    return Object.entries(dateCounts).map(([date, counts]) => {
      // Convert to simplified date label e.g., "05 ก.ค."
      const parts = date.split('-');
      const day = parts[2];
      const monthThShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][parseInt(parts[1]) - 1];
      return {
        rawDate: date,
        label: `${day} ${monthThShort}`,
        incoming: counts.incoming,
        outgoing: counts.outgoing,
        total: counts.incoming + counts.outgoing
      };
    });
  }, [records]);

  // Find max volume in chart data to scale SVG bars properly
  const maxChartVal = useMemo(() => {
    const max = Math.max(...registrationChartData.map(d => Math.max(d.incoming, d.outgoing)), 1);
    return max;
  }, [registrationChartData]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex flex-col md:flex-row" id="app_root">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in flex items-center space-x-3 bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-lg max-w-sm transition-all duration-300">
          <div className={`p-2 rounded-lg ${
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
            toast.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {toast.type === 'success' ? <Check className="h-5 w-5" /> :
             toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
          </div>
          <p className="text-sm font-medium text-slate-700">{toast.message}</p>
        </div>
      )}

      {/* Navigation Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0 shadow-lg md:sticky md:top-0 md:h-screen" id="app_sidebar">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-indigo-600 p-2.5 rounded-xl shadow-md shadow-indigo-500/25">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">ทะเบียนรับ-ส่ง</h1>
            <p className="text-xs text-indigo-300 font-medium">สพป. / สรบ. เอกสารราชการ</p>
          </div>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">เมนูบริการ</p>
          
          <button
            id="nav_dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Layers className="h-4.5 w-4.5" />
            <span>หน้าหลัก & แผงควบคุม</span>
          </button>

          <button
            id="nav_records"
            onClick={() => setActiveTab('records')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'records'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            <span>สมุดทะเบียนรับ-ส่ง</span>
            <span className="ml-auto bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full font-mono">
              {records.length}
            </span>
          </button>

          <button
            id="nav_add"
            onClick={() => {
              resetFormFields();
              setActiveTab('add');
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'add' && !editingRecord
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Plus className="h-4.5 w-4.5" />
            <span>ลงทะเบียนเอกสารใหม่</span>
          </button>

          <div className="pt-6">
            <p className="px-3 text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">ระบบข้อมูล</p>
            <button
              id="nav_settings"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              <span>จัดการและสำรองข้อมูล</span>
            </button>
          </div>
        </nav>

        {/* Google User Profile or Sign-In */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          {currentUser ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-left">
                {currentUser.picture ? (
                  <img src={currentUser.picture} className="h-9 w-9 rounded-full border border-slate-700 shrink-0" alt={currentUser.name} referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-slate-100 shrink-0 uppercase">
                    {currentUser.name.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</p>
                  <p className="text-4xs text-slate-400 truncate font-mono">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-center text-4xs font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors py-1.5 border border-rose-950/60 hover:border-rose-900/80 rounded-lg bg-rose-950/20"
              >
                ออกจากระบบ (Logout)
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-4xs text-slate-400 font-medium leading-relaxed">ลงชื่อเข้าใช้เพื่อเปิดระบบบันทึกชื่ออัตโนมัติ</p>
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold py-2 px-3 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.78 0 3.37.61 4.62 1.8l3.46-3.46C17.99 1.19 15.15 0 12 0 7.31 0 3.25 2.69 1.28 6.62l3.99 3.1C6.22 6.82 8.87 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.6-.2-2.36H12v4.47h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.65 2.84c2.14-1.97 3.74-4.87 3.74-8.51z" />
                  <path fill="#FBBC05" d="M5.27 14.28c-.25-.76-.39-1.57-.39-2.41s.14-1.65.39-2.41l-3.99-3.1C.48 8.07 0 9.98 0 12s.48 3.93 1.28 5.64l3.99-3.36z" />
                  <path fill="#34A853" d="M12 23.45c3.24 0 5.97-1.08 7.96-2.92l-3.65-2.84c-1.01.68-2.31 1.08-4.31 1.08-3.13 0-5.78-1.78-6.73-4.68l-3.99 3.1c1.97 3.93 6.03 6.62 12 6.62z" />
                </svg>
                <span>Google Sign-In</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0" id="app_main_content">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-20 flex items-center justify-between shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 'dashboard' && 'แดชบอร์ดสรุปภาพรวมเอกสาร'}
              {activeTab === 'records' && 'ทะเบียนเอกสารทั้งหมด'}
              {activeTab === 'add' && (editingRecord ? 'แก้ไขข้อมูลทะเบียนเอกสาร' : 'แบบฟอร์มลงทะเบียนรับ-ส่งเอกสารอย่างละเอียด')}
              {activeTab === 'settings' && 'การตั้งค่าระบบและจัดการข้อมูลสำรอง'}
            </h2>
            <p className="text-xs text-slate-500">
              {activeTab === 'dashboard' && 'สรุปสถิติจำนวนเอกสาร อัตราการดำเนินงาน และรายงานความเร่งด่วน'}
              {activeTab === 'records' && 'ค้นหา คัดกรอง และตรวจสอบหนังสือรับ-หนังสือส่งราชการ'}
              {activeTab === 'add' && (editingRecord ? `ปรับปรุงรายละเอียดเลขทะเบียนที่ ${editingRecord.regNo}` : 'ป้อนรายละเอียดข้อมูลหนังสือราชการอย่างครอบคลุมถ้วนถี่')}
              {activeTab === 'settings' && 'จัดการระบบนำเข้า ส่งออกไฟล์สำรอง และการล้างข้อมูลอย่างปลอดภัย'}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-1.5 text-xs bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200/60 font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span>วันที่ปัจจุบัน: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            
            {activeTab !== 'add' && (
              <button
                onClick={() => {
                  resetFormFields();
                  setActiveTab('add');
                }}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs hover:shadow transition-all duration-200 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>ลงทะเบียนด่วน</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* ======================================================== */}
          {/* 1. DASHBOARD VIEW */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6" id="dashboard_view">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Stats */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-500">เอกสารทั้งหมด</span>
                    <h3 className="text-2xl font-bold font-mono text-slate-800">{stats.total}</h3>
                    <p className="text-3xs text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-md inline-block">รับและส่งรวมกัน</p>
                  </div>
                  <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                    <BookOpen className="h-6 w-6" />
                  </div>
                </div>

                {/* Incoming Stats */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-500">หนังสือรับ (เข้า)</span>
                    <h3 className="text-2xl font-bold font-mono text-blue-600">{stats.incoming}</h3>
                    <p className="text-3xs text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-md inline-block">
                      {stats.total > 0 ? `${((stats.incoming / stats.total) * 100).toFixed(0)}%` : '0%'} ของทั้งหมด
                    </p>
                  </div>
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                    <Inbox className="h-6 w-6" />
                  </div>
                </div>

                {/* Outgoing Stats */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-500">หนังสือส่ง (ออก)</span>
                    <h3 className="text-2xl font-bold font-mono text-emerald-600">{stats.outgoing}</h3>
                    <p className="text-3xs text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block">
                      {stats.total > 0 ? `${((stats.outgoing / stats.total) * 100).toFixed(0)}%` : '0%'} ของทั้งหมด
                    </p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                    <Send className="h-6 w-6" />
                  </div>
                </div>

                {/* Urgent/Very Urgent Stats */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-500">งานเร่งด่วน / ด่วนที่สุด</span>
                    <h3 className="text-2xl font-bold font-mono text-rose-600">{stats.urgentCount}</h3>
                    <p className="text-3xs text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-md inline-block">ต้องดำเนินการทันที</p>
                  </div>
                  <div className="bg-rose-50 text-rose-600 p-3 rounded-xl">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>

              </div>

              {/* Central Dashboard Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Custom Document Registration Timeline Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
                        <h4 className="font-bold text-slate-800 text-sm">ปริมาณการลงรับ-ส่งย้อนหลัง 7 วัน</h4>
                      </div>
                      <span className="text-3xs text-slate-400 font-semibold uppercase">อัปเดตแบบเรียลไทม์</span>
                    </div>
                    
                    {/* SVG Chart Drawing */}
                    <div className="h-48 w-full flex items-end justify-between px-2 pt-6 relative border-b border-slate-100">
                      {/* Grid Lines */}
                      <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none opacity-40">
                        <div className="w-full border-t border-slate-100"></div>
                        <div className="w-full border-t border-slate-100"></div>
                        <div className="w-full border-t border-slate-100"></div>
                        <div className="w-full border-t border-slate-100"></div>
                      </div>

                      {registrationChartData.map((d, index) => {
                        // Calculate percentage heights
                        const incomingPct = d.incoming > 0 ? (d.incoming / maxChartVal) * 80 : 0; // max at 80% to fit labels
                        const outgoingPct = d.outgoing > 0 ? (d.outgoing / maxChartVal) * 80 : 0;
                        const hasValues = d.incoming > 0 || d.outgoing > 0;

                        return (
                          <div key={d.rawDate} className="flex-1 flex flex-col items-center z-10 mx-1 group relative">
                            {/* Hover tooltip */}
                            <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-3xs rounded-md px-2 py-1 hidden group-hover:block whitespace-nowrap z-30 shadow-md">
                              <span className="block text-indigo-300 font-semibold">{d.rawDate}</span>
                              <span className="block">หนังสือรับ: {d.incoming} เล่ม</span>
                              <span className="block">หนังสือส่ง: {d.outgoing} เล่ม</span>
                              <span className="block border-t border-slate-700 mt-0.5 pt-0.5 font-bold">รวมทั้งหมด: {d.total} เล่ม</span>
                            </div>

                            {/* Multi-bars container */}
                            <div className="w-full flex items-end justify-center space-x-1.5 h-36">
                              {/* Incoming bar */}
                              <div 
                                style={{ height: `${Math.max(incomingPct, 4)}%` }} 
                                className={`w-3.5 rounded-t-sm transition-all duration-300 ${
                                  d.incoming > 0 
                                    ? 'bg-blue-500/80 group-hover:bg-blue-500' 
                                    : 'bg-transparent'
                                }`}
                              ></div>
                              {/* Outgoing bar */}
                              <div 
                                style={{ height: `${Math.max(outgoingPct, 4)}%` }} 
                                className={`w-3.5 rounded-t-sm transition-all duration-300 ${
                                  d.outgoing > 0 
                                    ? 'bg-emerald-500/80 group-hover:bg-emerald-500' 
                                    : 'bg-transparent'
                                }`}
                              ></div>
                            </div>

                            <span className="text-3xs text-slate-500 font-semibold mt-2 truncate max-w-full block">
                              {d.label}
                            </span>
                            {hasValues && (
                              <span className="text-4xs text-slate-400 font-mono font-bold mt-0.5">
                                {d.total}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-3xs mt-4 pt-4 border-t border-slate-100 text-slate-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
                        <span>หนังสือรับเข้า</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>
                        <span>หนังสือส่งออก</span>
                      </div>
                    </div>
                    <span>กดชี้ที่แท่งเพื่อดูปริมาณละเอียด</span>
                  </div>
                </div>

                {/* 2. Status Distribution Widget */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-4">สถานะกระบวนการทำงาน</h4>
                    
                    <div className="space-y-4">
                      {/* Completed */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1"></span>
                            ดำเนินการเสร็จสิ้น
                          </span>
                          <span className="font-mono text-slate-800">{stats.completed} ({stats.total > 0 ? ((stats.completed/stats.total)*100).toFixed(0) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${stats.total > 0 ? (stats.completed/stats.total)*100 : 0}%` }}
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          ></div>
                        </div>
                      </div>

                      {/* In Progress */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1"></span>
                            กำลังดำเนินการ
                          </span>
                          <span className="font-mono text-slate-800">{stats.inProgress} ({stats.total > 0 ? ((stats.inProgress/stats.total)*100).toFixed(0) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${stats.total > 0 ? (stats.inProgress/stats.total)*100 : 0}%` }}
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          ></div>
                        </div>
                      </div>

                      {/* Pending */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1"></span>
                            รอดำเนินการ
                          </span>
                          <span className="font-mono text-slate-800">{stats.pending} ({stats.total > 0 ? ((stats.pending/stats.total)*100).toFixed(0) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${stats.total > 0 ? (stats.pending/stats.total)*100 : 0}%` }}
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          ></div>
                        </div>
                      </div>

                      {/* Cancelled */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block mr-1"></span>
                            ยกเลิก/อื่น ๆ
                          </span>
                          <span className="font-mono text-slate-800">{stats.cancelled} ({stats.total > 0 ? ((stats.cancelled/stats.total)*100).toFixed(0) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${stats.total > 0 ? (stats.cancelled/stats.total)*100 : 0}%` }}
                            className="bg-slate-400 h-full rounded-full transition-all duration-500"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center space-x-2 text-3xs text-slate-500 mt-4">
                    <Info className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    <span>จำนวนเอกสารรอดำเนินการบวกกับกำลังดำเนินการควรเสร็จสิ้นตามกรอบเวลาของคู่มือสารบรรณ</span>
                  </div>
                </div>

              </div>

              {/* 3. Recent Registered Records Table (Top 4) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4.5 w-4.5 text-indigo-500" />
                    <h4 className="font-bold text-slate-800 text-sm">รายการลงทะเบียนล่าสุด 4 ลำดับแรก</h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('records')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 transition-all"
                  >
                    <span>ดูทั้งหมด</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                      <tr>
                        <th className="p-3.5 rounded-l-lg">เลขทะเบียน</th>
                        <th className="p-3.5">ประเภท</th>
                        <th className="p-3.5">เลขที่หนังสือ</th>
                        <th className="p-3.5">วันที่รับ-ส่ง</th>
                        <th className="p-3.5">เรื่อง</th>
                        <th className="p-3.5">สถานะ</th>
                        <th className="p-3.5 rounded-r-lg text-right">เครื่องมือ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {records.slice(0, 4).map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-semibold text-slate-900">{r.regNo}</td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold ${
                              r.type === 'incoming' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {r.type === 'incoming' ? 'หนังสือรับ' : 'หนังสือส่ง'}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">{r.docNo}</td>
                          <td className="p-3.5 font-mono">{r.regDate}</td>
                          <td className="p-3.5 font-medium max-w-xs truncate">{r.subject}</td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-3xs font-bold leading-none ${
                              r.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              r.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              r.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              <span>{
                                r.status === 'completed' ? 'เสร็จสิ้น' :
                                r.status === 'in_progress' ? 'กำลังทำ' :
                                r.status === 'pending' ? 'รอดำเนินการ' : 'ยกเลิก'
                              }</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setSelectedRecord(r)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-3xs px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              เปิดดูอย่างละเอียด
                            </button>
                          </td>
                        </tr>
                      ))}
                      {records.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                            ไม่พบข้อมูลในสารบรรณ กรุณาป้อนข้อมูลลงสมุดใหม่
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* 2. RECORDS LOG VIEW */}
          {/* ======================================================== */}
          {activeTab === 'records' && (
            <div className="space-y-6" id="records_log_view">
              
              {/* Filter Panel Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4.5 w-4.5 text-indigo-500" />
                    <h4 className="font-bold text-slate-800 text-sm">การจัดเรียง ค้นหา และตัวกรองข้อมูลขั้นสูง</h4>
                  </div>
                  {(searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterUrgency !== 'all' || filterStartDate || filterEndDate) && (
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold transition-all"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search query input */}
                  <div className="relative md:col-span-2">
                    <label className="text-3xs font-bold text-slate-400 uppercase block mb-1">คำค้นหาหลัก</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="เลขรับ-ส่ง, เลขเอกสาร, ชื่อเรื่อง, ผู้ส่ง, ผู้ปฏิบัติงาน..."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-10 pr-4 py-2 text-xs font-medium transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Document Type select */}
                  <div>
                    <label className="text-3xs font-bold text-slate-400 uppercase block mb-1">ประเภททะเบียน</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-medium transition-all outline-none"
                    >
                      <option value="all">ทั้งหมด (รับ-ส่ง)</option>
                      <option value="incoming">หนังสือรับ (เข้า)</option>
                      <option value="outgoing">หนังสือส่ง (ออก)</option>
                    </select>
                  </div>

                  {/* Status select */}
                  <div>
                    <label className="text-3xs font-bold text-slate-400 uppercase block mb-1">สถานะดำเนินการ</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-medium transition-all outline-none"
                    >
                      <option value="all">ทุกสถานะ</option>
                      <option value="pending">รอดำเนินการ</option>
                      <option value="in_progress">กำลังดำเนินการ</option>
                      <option value="completed">ดำเนินการเสร็จสิ้น</option>
                      <option value="cancelled">ยกเลิก/อื่น ๆ</option>
                    </select>
                  </div>

                  {/* Urgency select */}
                  <div>
                    <label className="text-3xs font-bold text-slate-400 uppercase block mb-1">ความเร่งด่วน</label>
                    <select
                      value={filterUrgency}
                      onChange={(e) => setFilterUrgency(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-medium transition-all outline-none"
                    >
                      <option value="all">ทุกระดับความด่วน</option>
                      <option value="normal">ปกติ</option>
                      <option value="urgent">ด่วน</option>
                      <option value="very_urgent">ด่วนที่สุด</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="text-3xs font-bold text-slate-400 uppercase block mb-1">ตั้งแต่วันที่ (รับ/ส่ง)</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all outline-none"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="text-3xs font-bold text-slate-400 uppercase block mb-1">ถึงวันที่ (รับ/ส่ง)</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all outline-none"
                    />
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-end space-x-2">
                    <button
                      onClick={exportCSV}
                      disabled={filteredRecords.length === 0}
                      className="flex-1 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 disabled:pointer-events-none text-emerald-700 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center space-x-1 transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>ส่งออก Excel</span>
                    </button>
                  </div>
                </div>

                <div className="text-3xs text-slate-400 font-medium">
                  พบคัดกรองทั้งหมด <strong className="text-indigo-600 font-bold">{filteredRecords.length}</strong> จาก {records.length} รายการทั้งหมดในฐานข้อมูลระบบ
                </div>
              </div>

              {/* Main Log Table Panel */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 min-w-[1000px]">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/60 uppercase">
                      <tr>
                        <th className="p-4 w-28">เลขทะเบียน</th>
                        <th className="p-4 w-28">ประเภท</th>
                        <th className="p-4 w-36">เลขเอกสาร & ลงวันที่</th>
                        <th className="p-4 w-32">วันที่รับ/ส่ง</th>
                        <th className="p-4">รายละเอียดเนื้อหาเรื่อง</th>
                        <th className="p-4 w-48">ผู้ส่ง / ผู้รับ</th>
                        <th className="p-4 w-28">สถานะ / ความด่วน</th>
                        <th className="p-4 w-40 text-right">การจัดการรายการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRecords.map(r => {
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50 transition-all">
                            
                            {/* Registration Number */}
                            <td className="p-4 font-mono font-bold text-slate-900 align-top">
                              {r.regNo}
                            </td>

                            {/* Document Type Badge */}
                            <td className="p-4 align-top">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-3xs font-bold ${
                                r.type === 'incoming' 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {r.type === 'incoming' ? 'หนังสือรับ' : 'หนังสือส่ง'}
                              </span>
                            </td>

                            {/* Document Reference Number & Date */}
                            <td className="p-4 align-top space-y-1">
                              <div className="font-mono text-slate-900 font-semibold break-all">{r.docNo}</div>
                              <div className="text-3xs text-slate-400 flex items-center">
                                <Calendar className="h-3 w-3 mr-1 inline" />
                                <span>ลว. {r.docDate}</span>
                              </div>
                            </td>

                            {/* System Registry Date */}
                            <td className="p-4 align-top font-mono text-slate-600 space-y-1">
                              <div>{r.regDate}</div>
                              {r.regTime && (
                                <div className="text-3xs text-indigo-500 flex items-center font-sans font-semibold">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  <span>{r.regTime} น.</span>
                                </div>
                              )}
                            </td>

                            {/* Subject */}
                            <td className="p-4 align-top">
                              <div className="font-semibold text-slate-800 line-clamp-2 hover:line-clamp-none transition-all leading-relaxed">
                                {r.subject}
                              </div>
                              {r.owner && (
                                <div className="text-3xs text-indigo-600 font-semibold mt-1 bg-indigo-50/60 px-1.5 py-0.5 rounded-md inline-block">
                                  ผู้รับผิดชอบ: {r.owner}
                                </div>
                              )}
                            </td>

                            {/* Sender and Recipient */}
                            <td className="p-4 align-top space-y-1.5 text-3xs">
                              <div>
                                <span className="text-slate-400 font-bold block">จาก:</span>
                                <span className="font-semibold text-slate-700 block truncate max-w-[200px]" title={r.sender}>{r.sender}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold block">ถึง:</span>
                                <span className="font-semibold text-slate-700 block truncate max-w-[200px]" title={r.receiver}>{r.receiver}</span>
                              </div>
                              {r.registeredBy && (
                                <div className="pt-1 border-t border-slate-100 mt-1">
                                  <span className="text-slate-400 block font-semibold">ผู้ลงบันทึก:</span>
                                  <span className="font-medium text-indigo-600 block truncate max-w-[200px]" title={r.registeredBy}>{r.registeredBy}</span>
                                </div>
                              )}
                            </td>

                            {/* Status & Urgency */}
                            <td className="p-4 align-top space-y-1.5">
                              {/* Urgency Badge */}
                              <div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-4xs font-bold tracking-wide ${
                                  r.urgency === 'very_urgent' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                  r.urgency === 'urgent' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {r.urgency === 'very_urgent' ? 'ด่วนที่สุด' : r.urgency === 'urgent' ? 'ด่วน' : 'ปกติ'}
                                </span>
                              </div>

                              {/* Status Indicator */}
                              <div className="flex items-center space-x-1.5">
                                <span className={`w-2 h-2 rounded-full ${
                                  r.status === 'completed' ? 'bg-emerald-500' :
                                  r.status === 'in_progress' ? 'bg-blue-500' :
                                  r.status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'
                                }`}></span>
                                <span className="text-3xs font-semibold text-slate-700">
                                  {
                                    r.status === 'completed' ? 'เสร็จสิ้น' :
                                    r.status === 'in_progress' ? 'กำลังทำ' :
                                    r.status === 'pending' ? 'รอดำเนินการ' : 'ยกเลิก'
                                  }
                                </span>
                              </div>
                            </td>

                            {/* Actions buttons */}
                            <td className="p-4 align-top text-right space-y-1 md:space-y-0 md:space-x-1">
                              <button
                                onClick={() => setSelectedRecord(r)}
                                title="ดูข้อมูลอย่างละเอียด"
                                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 transition-all inline-block"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                              
                              <button
                                onClick={() => startEdit(r)}
                                title="แก้ไขรายการนี้"
                                className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-indigo-600 hover:text-indigo-800 transition-all inline-block"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteRecord(r.id)}
                                title="ลบรายการนี้"
                                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg text-rose-600 hover:text-rose-800 transition-all inline-block"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>

                          </tr>
                        );
                      })}

                      {filteredRecords.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-slate-400">
                            <Info className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-sm">ไม่พบเอกสารตามเงื่อนไขที่เลือก</p>
                            <p className="text-xs mt-1">ลองเปลี่ยนคำค้นหา ปรับสถานะ หรือกดปุ่ม "ล้างตัวกรองทั้งหมด" ด้านบน</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                {filteredRecords.length > 0 && (
                  <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs text-slate-500 font-medium">
                      กำลังแสดงลำดับที่ {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredRecords.length)} จากทั้งหมด {filteredRecords.length} รายการ
                    </span>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        ก่อนหน้า
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8.5 h-8.5 border rounded-lg text-xs font-semibold transition-all ${
                            currentPage === page
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* 3. ADD / EDIT RECORD FORM */}
          {/* ======================================================== */}
          {activeTab === 'add' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-4xl mx-auto" id="add_record_view">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {editingRecord ? 'ฟอร์มแก้ไขข้อมูลเอกสารราชการ' : 'ป้อนรายละเอียดการลงทะเบียนสารบรรณ'}
                    </h4>
                    <p className="text-3xs text-slate-400">กรอกข้อมูลให้ครบถ้วนเพื่อประโยชน์ในการจัดระเบียบและการสืบค้นย้อนหลัง</p>
                  </div>
                </div>

                {editingRecord && (
                  <button
                    onClick={() => {
                      resetFormFields();
                      setActiveTab('records');
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>ยกเลิกการแก้ไข</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveRecord} className="space-y-6">
                
                {/* Form Row 1: Document Type & Urgency & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Type Selector (Radio Style) */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-2">ประเภทหนังสือ *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormType('incoming')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                          formType === 'incoming'
                            ? 'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-100'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Inbox className="h-4 w-4 shrink-0" />
                        <span>หนังสือรับ (เข้า)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormType('outgoing')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                          formType === 'outgoing'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-100'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Send className="h-4 w-4 shrink-0" />
                        <span>หนังสือส่ง (ออก)</span>
                      </button>
                    </div>
                  </div>

                  {/* Urgency Level */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-2">ระดับความด่วน *</label>
                    <select
                      value={formUrgency}
                      onChange={(e) => setFormUrgency(e.target.value as DocUrgency)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-medium transition-all outline-none"
                    >
                      <option value="normal">ปกติ (ดำเนินงานตามลำดับ)</option>
                      <option value="urgent">ด่วน (ต้องทำภายในกำหนด)</option>
                      <option value="very_urgent">ด่วนที่สุด (ทำทันทีเมื่อได้รับ)</option>
                    </select>
                  </div>

                  {/* Status Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-2">สถานะการทำงาน *</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as DocStatus)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-medium transition-all outline-none"
                    >
                      <option value="pending">รอดำเนินการ</option>
                      <option value="in_progress">กำลังดำเนินการ</option>
                      <option value="completed">ดำเนินการเสร็จสิ้น</option>
                      <option value="cancelled">ยกเลิก/อื่น ๆ</option>
                    </select>
                  </div>

                </div>

                {/* Form Row 2: Reg No & Doc No */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Reg Number (Unique Register identifier) */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5 flex items-center justify-between">
                      <span>เลขทะเบียนรับ-ส่ง (เล่มที่/ปี) *</span>
                      <button
                        type="button"
                        onClick={handleAutoFillRegNo}
                        className="text-4xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md transition-all uppercase"
                      >
                        แนะนำเลขถัดไป
                      </button>
                    </label>
                    <input
                      type="text"
                      value={formRegNo}
                      onChange={(e) => setFormRegNo(e.target.value)}
                      placeholder="เช่น 005/2569"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2 text-xs font-mono font-bold tracking-wide transition-all outline-none"
                    />
                    <span className="text-4xs text-slate-400 mt-1 block font-medium">ปกติรันต่อเนื่องโดยบวกทีละหนึ่ง หรือปรับเองตามเล่มสารบรรณ</span>
                  </div>

                  {/* Doc No (Official Reference code) */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">เลขที่หนังสือราชการ (เลขต้นเรื่อง) *</label>
                    <input
                      type="text"
                      value={formDocNo}
                      onChange={(e) => setFormDocNo(e.target.value)}
                      placeholder="เช่น มท 0211.3/ว 1420 หรือ ด่วนที่สุด ที่ นร 0505/ว 88"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2 text-xs font-mono font-semibold transition-all outline-none"
                    />
                    <span className="text-4xs text-slate-400 mt-1 block font-medium">รหัสพยัญชนะและเลขลำดับหนังสือจากต้นทางผู้ส่ง</span>
                  </div>

                </div>

                {/* Form Row 3: Dates and Registration Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Doc Date (ลงวันที่หนังสือ) */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5 flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                      <span>ลงวันที่ในหนังสือ *</span>
                    </label>
                    <input
                      type="date"
                      value={formDocDate}
                      onChange={(e) => setFormDocDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-1.5 text-xs font-medium font-mono transition-all outline-none"
                    />
                    <span className="text-4xs text-slate-400 mt-1 block font-medium">วันที่เขียน/ลงนามหนังสือที่ระบุอยู่ในหน้ากระดาษ</span>
                  </div>

                  {/* Registry Date (วันที่รับหรือส่งจริง) */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5 flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                      <span>วันที่ลงทะเบียน (รับ/ส่งจริง) *</span>
                    </label>
                    <input
                      type="date"
                      value={formRegDate}
                      onChange={(e) => setFormRegDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-1.5 text-xs font-medium font-mono transition-all outline-none"
                    />
                    <span className="text-4xs text-slate-400 mt-1 block font-medium">วันที่หน่วยงานลงประทับตราหรือลงเลขทะเบียนจริง</span>
                  </div>

                  {/* Registry Time (เวลาลงทะเบียนจริง) */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5 flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      <span>เวลาในการรับ-ส่งจริง *</span>
                    </label>
                    <input
                      type="time"
                      value={formRegTime}
                      onChange={(e) => setFormRegTime(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-1.5 text-xs font-medium font-mono transition-all outline-none"
                    />
                    <span className="text-4xs text-slate-400 mt-1 block font-medium">เวลาบันทึกเอกสารราชการลงทะเบียนจริง</span>
                  </div>

                </div>

                {/* Form Row 4: From / To with Autocomplete Datatables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* From (ผู้ส่ง) */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">จาก (หน่วยงานต้นสังกัดผู้ส่ง / คนส่ง) *</label>
                    <input
                      type="text"
                      value={formSender}
                      onChange={(e) => setFormSender(e.target.value)}
                      list="senders_list"
                      placeholder="ระบุชื่อผู้ส่ง หรือเลือกจากรายการยอดนิยม..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2 text-xs font-medium transition-all outline-none"
                    />
                    <datalist id="senders_list">
                      {COMMON_SENDERS_INCOMING.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>

                  {/* To (ผู้รับ) */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">ถึง (หน่วยงานปลายทางผู้รับ / คนรับ) *</label>
                    <input
                      type="text"
                      value={formReceiver}
                      onChange={(e) => setFormReceiver(e.target.value)}
                      list="receivers_list"
                      placeholder="ระบุผู้รับ หรือเลือกจากรายการยอดนิยม..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2 text-xs font-medium transition-all outline-none"
                    />
                    <datalist id="receivers_list">
                      {COMMON_RECEIVERS_INCOMING.map(r => <option key={r} value={r} />)}
                    </datalist>
                  </div>

                </div>

                {/* Form Row 5: Subject (เรื่อง) */}
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">ชื่อเรื่อง (สาระสำคัญ) *</label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="กรอกชื่อโครงการ การประชุม หรือวัตถุประสงค์หนังสืออย่างชัดเจน..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2 text-xs font-semibold transition-all outline-none"
                  />
                </div>

                {/* Form Row 6: Registered By & Owner & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Registered By */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5 flex items-center justify-between">
                      <span>ผู้ลงทะเบียนประทับรับเรื่อง</span>
                      {currentUser && (
                        <span className="text-4xs text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-md">เชื่อมต่อ Google แล้ว</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formRegisteredBy}
                      onChange={(e) => setFormRegisteredBy(e.target.value)}
                      placeholder={currentUser ? currentUser.name : "เช่น สมชาย สารบรรณ"}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2 text-xs font-medium transition-all outline-none"
                    />
                    <span className="text-4xs text-slate-400 mt-1 block font-medium">ชื่อเจ้าหน้าที่ที่ประทับบันทึกเอกสารลงระบบ</span>
                  </div>

                  {/* Owner */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">ผู้ปฏิบัติงาน / ผู้รับมอบหมายดำเนินการ</label>
                    <input
                      type="text"
                      value={formOwner}
                      onChange={(e) => setFormOwner(e.target.value)}
                      placeholder="เช่น ฝ่ายส่งเสริมการเรียนรู้, นางสาวสมศรี มีดี"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2 text-xs font-medium transition-all outline-none"
                    />
                    <span className="text-4xs text-slate-400 mt-1 block font-medium">หน่วยงานหรือชื่อบุคคลหลักที่รับหน้าที่ดำเนินการ</span>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">หมายเหตุ / บันทึกประวัติจัดส่ง</label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="เช่น จัดส่ง ปณ. ด่วนพิเศษ หรือ มีเอกสารแนบ..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2 text-xs font-medium transition-all outline-none"
                    />
                    <span className="text-4xs text-slate-400 mt-1 block font-medium">ความเห็นเพิ่มเติมหรือเลขที่อ้างอิงส่งพัสดุ</span>
                  </div>

                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      resetFormFields();
                      setActiveTab('records');
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    ยกเลิกและย้อนกลับ
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>{editingRecord ? 'บันทึกการแก้ไขเอกสาร' : 'ยืนยันลงทะเบียนลงสมุด'}</span>
                  </button>
                </div>

              </form>

            </div>
          )}

          {/* ======================================================== */}
          {/* 4. SETTINGS & DATA MANAGEMENT VIEW */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6" id="settings_view">
              
              {/* Back up Panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">การจัดเก็บสำรองและกู้คืนสารบรรณ</h4>
                    <p className="text-3xs text-slate-400">สำรองฐานข้อมูลเอกสารของคุณเก็บไว้ภายนอกเพื่อความปลอดภัยสูงสุดของข้อมูล</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Backup Card */}
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3">
                    <h5 className="font-bold text-xs text-slate-800">1. การสำรองไฟล์ (Export Backup)</h5>
                    <p className="text-3xs text-slate-500 leading-relaxed">
                      ดาวน์โหลดข้อมูลลงทะเบียนเอกสารทั้งหมดเป็นไฟล์รูปแบบ JSON เก็บไว้ในอุปกรณ์ของคุณ เพื่อความสะดวกในการย้ายข้อมูลหรือป้องกันเหตุฉุกเฉิน
                    </p>
                    <button
                      onClick={exportJSONBackup}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-3xs font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-1 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>ดาวน์โหลดไฟล์สำรอง .json</span>
                    </button>
                  </div>

                  {/* Restore Card */}
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3">
                    <h5 className="font-bold text-xs text-slate-800">2. การกู้คืนข้อมูล (Import Backup)</h5>
                    <p className="text-3xs text-slate-500 leading-relaxed">
                      กู้คืนข้อมูลเดิมโดยใช้ไฟล์ .json ที่อัปโหลดเข้ามา โดยไฟล์ดังกล่าวต้องเป็นรูปแบบโครงสร้างเดียวกันที่ดาวน์โหลดออกจากระบบนี้
                    </p>
                    
                    <label className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-3xs font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-1 transition-all cursor-pointer border-dashed">
                      <Upload className="h-3.5 w-3.5 text-indigo-500" />
                      <span>เลือกไฟล์สำรองเพื่อกู้คืน</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJSONBackup}
                        className="hidden"
                      />
                    </label>
                  </div>

                </div>
              </div>

              {/* Maintenance Tools Panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">เครื่องมือการดูแลและจัดเก็บสถานะระบบ</h4>
                    <p className="text-3xs text-slate-400">ปรับแต่งตัวเลือกจำลองสถานะสารบรรณหรือล้างข้อมูลล้างบางเครื่องมือ</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Recover Sample Data */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-slate-800">กู้คืนข้อมูลทดลองเริ่มต้น</h5>
                      <p className="text-3xs text-slate-500 leading-relaxed">
                        เขียนทับสารบรรณปัจจุบันด้วยชุดข้อมูลตัวอย่างของทางสำนักงาน (ช่วยให้ใช้งานง่ายเมื่อต้องการทดลองสาธิตการใช้ระบบ)
                      </p>
                    </div>
                    <button
                      onClick={handleResetToDefault}
                      className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-3xs py-2 px-4 rounded-lg transition-all shrink-0 cursor-pointer"
                    >
                      เติมข้อมูลสาธิต
                    </button>
                  </div>

                  {/* Factory Reset database */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-rose-50/50 border border-rose-100 rounded-xl">
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-rose-800">ล้างข้อมูลในระบบทั้งหมด (Factory Reset)</h5>
                      <p className="text-3xs text-rose-600 leading-relaxed">
                        ลบรายการเอกสารทะเบียนรับ-ส่งทั้งหมดอย่างถาวร ทะเบียนเล่มเดิมที่บันทึกไว้ในเบราว์เซอร์จะหายไปทั้งหมด
                      </p>
                    </div>
                    <button
                      onClick={handleClearAllData}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-3xs py-2 px-4 rounded-lg transition-all shrink-0 cursor-pointer"
                    >
                      ลบข้อมูลทั้งหมด
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* ======================================================== */}
      {/* 5. DETAILED MODAL SHEET */}
      {/* ======================================================== */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 animate-fade-in" id="detail_modal_backdrop">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-slide-up" id="detail_modal_container">
            
            {/* Modal Header */}
            <div className={`p-5 text-white flex items-center justify-between ${
              selectedRecord.type === 'incoming' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700' 
                : 'bg-gradient-to-r from-emerald-600 to-teal-700'
            }`}>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <div>
                  <h3 className="font-bold text-sm">แผ่นลงทะเบียนเอกสาร {selectedRecord.type === 'incoming' ? 'หนังสือรับ' : 'หนังสือส่ง'}</h3>
                  <p className="text-3xs opacity-85 font-mono">เลขอ้างอิงระบบ: {selectedRecord.id}</p>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-full hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Official Slip Layout */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Slip Document Header */}
              <div className="border-b-4 border-double border-slate-200 pb-5 text-center space-y-1">
                <h2 className="text-base font-bold text-slate-800 tracking-wider">สมุดลงทะเบียนรับ-ส่งเอกสารสารบรรณ</h2>
                <p className="text-3xs text-slate-500 font-semibold uppercase font-mono">Official Document registry slip</p>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                
                {/* Reg No */}
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">เลขทะเบียนรับ-ส่ง</span>
                  <span className="font-mono text-slate-900 font-bold text-sm">{selectedRecord.regNo}</span>
                </div>

                {/* Doc Type */}
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">ประเภทเอกสาร</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-3xs font-bold mt-0.5 ${
                    selectedRecord.type === 'incoming' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>{selectedRecord.type === 'incoming' ? 'หนังสือรับเข้า' : 'หนังสือส่งออก'}</span>
                </div>

                {/* Doc No */}
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">เลขที่หนังสือราชการ</span>
                  <span className="font-mono text-slate-900 font-bold">{selectedRecord.docNo}</span>
                </div>

                {/* Urgency */}
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">ระดับความเร็วด่วน</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-3xs font-bold mt-0.5 ${
                    selectedRecord.urgency === 'very_urgent' ? 'bg-rose-100 text-rose-800' :
                    selectedRecord.urgency === 'urgent' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>{selectedRecord.urgency === 'very_urgent' ? 'ด่วนที่สุด' : selectedRecord.urgency === 'urgent' ? 'ด่วน' : 'ปกติ'}</span>
                </div>

                {/* Doc Date */}
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase flex items-center">
                    <Calendar className="h-3 w-3 text-indigo-500 mr-1 inline" />
                    <span>ลงวันที่เอกสาร (ต้นทาง)</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-800">{selectedRecord.docDate}</span>
                </div>

                {/* Reg Date */}
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase flex items-center">
                    <Calendar className="h-3 w-3 text-emerald-500 mr-1 inline" />
                    <span>วันที่ลงประทับตรา (สารบรรณ)</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-800">{selectedRecord.regDate}</span>
                </div>

                {/* Reg Time */}
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase flex items-center">
                    <Clock className="h-3 w-3 text-indigo-500 mr-1 inline" />
                    <span>เวลาในการรับ-ส่งจริง</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-600">{selectedRecord.regTime || '-'} น.</span>
                </div>

                {/* Sender */}
                <div className="border-b border-slate-100 pb-2 sm:col-span-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">จากหน่วยงานผู้ส่ง / คนส่ง</span>
                  <span className="font-medium text-slate-800">{selectedRecord.sender}</span>
                </div>

                {/* Receiver */}
                <div className="border-b border-slate-100 pb-2 sm:col-span-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">ถึงหน่วยงานปลายทางผู้รับ / คนรับ</span>
                  <span className="font-medium text-slate-800">{selectedRecord.receiver}</span>
                </div>

                {/* Subject */}
                <div className="border-b border-slate-100 pb-3 sm:col-span-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">เรื่องสาระสำคัญ</span>
                  <span className="font-semibold text-slate-900 text-sm leading-relaxed block bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">{selectedRecord.subject}</span>
                </div>

                {/* Owner */}
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">ผู้มอบหมายปฏิบัติงาน/ผู้รับผิดชอบ</span>
                  <span className="font-semibold text-indigo-700">{selectedRecord.owner || '-'}</span>
                </div>

                {/* Registered By */}
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">เจ้าหน้าที่ผู้ลงประทับบันทึกระบบ</span>
                  <span className="font-semibold text-indigo-600">{selectedRecord.registeredBy || 'ผู้ดูแลระบบสารบรรณ'}</span>
                </div>

                {/* Status */}
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">สถานะปัจจุบัน</span>
                  <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-3xs font-bold mt-1 ${
                    selectedRecord.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    selectedRecord.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    selectedRecord.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedRecord.status === 'completed' ? 'bg-emerald-500' :
                      selectedRecord.status === 'in_progress' ? 'bg-blue-500' :
                      selectedRecord.status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'
                    }`}></span>
                    <span>{
                      selectedRecord.status === 'completed' ? 'ดำเนินการเสร็จสิ้น' :
                      selectedRecord.status === 'in_progress' ? 'กำลังดำเนินการ' :
                      selectedRecord.status === 'pending' ? 'รอดำเนินการ' : 'ยกเลิก'
                    }</span>
                  </span>
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">ความเห็น/หมายเหตุเพิ่มเติม</span>
                  <span className="font-medium text-slate-700 block bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/50 mt-1 italic">
                    {selectedRecord.notes || 'ไม่มีหมายเหตุเพิ่มเติม'}
                  </span>
                </div>

              </div>

              {/* Date registered in system logs */}
              <p className="text-4xs text-slate-400 font-mono text-center pt-2">
                วันที่ถูกบันทึกเข้าระบบ: {new Date(selectedRecord.createdAt).toLocaleString('th-TH')}
              </p>

            </div>

            {/* Modal Footer Controls */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => copyRecordToClipboard(selectedRecord)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Copy className="h-4 w-4" />
                <span>คัดลอกสรุปย่อ</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => startEdit(selectedRecord)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Edit className="h-4 w-4" />
                  <span>แก้ไขข้อมูล</span>
                </button>

                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

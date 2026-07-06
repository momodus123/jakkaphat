export type DocType = 'incoming' | 'outgoing';
export type DocUrgency = 'normal' | 'urgent' | 'very_urgent';
export type DocStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface DocumentRecord {
  id: string;
  type: DocType;
  regNo: string;       // เลขทะเบียนรับ-ส่ง (เช่น 001/2569)
  docNo: string;       // เลขที่หนังสือ (เช่น มท 0102/ว 999)
  docDate: string;     // ลงวันที่ (ในหนังสือ)
  regDate: string;     // วันที่รับ-ส่ง (วันที่ลงทะเบียน)
  regTime: string;     // เวลาในการรับ-ส่ง (เช่น 14:30)
  sender: string;      // จาก
  receiver: string;    // ถึง
  subject: string;     // เรื่อง
  owner: string;       // ผู้ปฏิบัติ/ผู้รับผิดชอบ
  urgency: DocUrgency; // ความเร่งด่วน (ปกติ, ด่วน, ด่วนที่สุด)
  status: DocStatus;   // สถานะ (รอดำเนินการ, กำลังดำเนินการ, ดำเนินการเสร็จสิ้น, ยกเลิก)
  notes: string;       // หมายเหตุ
  registeredBy?: string; // ผู้ลงทะเบียน / ผู้รับผิดชอบบันทึก (เชื่อมจาก Google Login)
  createdAt: string;   // เวลาที่บันทึกเข้าระบบ
}

export interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
}

export interface StatsSummary {
  total: number;
  incoming: number;
  outgoing: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  urgentCount: number;
}

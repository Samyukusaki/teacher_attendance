import { AttendanceRecord, SchoolInfo, Teacher, GradeClass, Subject, LeaveRequest } from '../types';
import { formatKhmerDate, toKhmerNumber, STATUS_META } from '../utils/khmerDate';

export interface SendTelegramResult {
  success: boolean;
  message: string;
  timestamp?: string;
  response?: any;
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<SendTelegramResult> {
  if (!botToken || !chatId) {
    return {
      success: false,
      message: 'សូមបញ្ចូល Telegram Bot Token និង Chat ID ជាមុនសិន!',
    };
  }

  // Clean inputs
  const token = botToken.trim();
  const chat = chatId.trim();

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chat,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      return {
        success: true,
        message: 'ផ្ញើសារទៅកាន់ Telegram បានជោគជ័យ!',
        timestamp: new Date().toLocaleTimeString('km-KH'),
        response: data,
      };
    } else {
      return {
        success: false,
        message: `Telegram Error: ${data.description || 'បរាជ័យក្នុងការផ្ញើសារ'}`,
        timestamp: new Date().toLocaleTimeString('km-KH'),
        response: data,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Error Network: មិនអាចភ្ជាប់ទៅកាន់ Telegram Server បានទេ (${err.message || 'សូមពិនិត្យមើលការតភ្ជាប់អ៊ីនធឺណិត'})`,
      timestamp: new Date().toLocaleTimeString('km-KH'),
    };
  }
}

// 1. Format Teacher Attendance Check-in Message
export function formatTeacherAttendanceSubmitMessage(
  school: SchoolInfo,
  teacher: Teacher,
  records: AttendanceRecord[],
  classes: GradeClass[],
  subjects: Subject[]
): string {
  const dateStr = records[0]?.date || new Date().toISOString().split('T')[0];
  const khmerDate = formatKhmerDate(dateStr);
  const currentTime = new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' });

  let msg = `<b>🏫 ${school.nameKh || 'សាលារៀន'}</b>\n`;
  msg += `<b>🔔 ការចុះវត្តមានបង្រៀនថ្មី</b>\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 <b>គ្រូបង្រៀន៖</b> ${teacher.nameKh} (កូដ: ${teacher.code})\n`;
  msg += `📅 <b>កាលបរិច្ឆេទ៖</b> ${khmerDate}\n`;
  msg += `⏰ <b>ម៉ោងបញ្ជូន៖</b> ${toKhmerNumber(currentTime)}\n\n`;
  msg += `<b>📋 ព័ត៌មានលម្អិតម៉ោងបង្រៀន៖</b>\n`;

  records.forEach((r, idx) => {
    const cls = classes.find((c) => c.id === r.gradeId)?.nameKh || 'មិនស្គាល់';
    const subj = subjects.find((s) => s.id === r.subjectId)?.nameKh || 'មិនស្គាល់';
    const statusMeta = STATUS_META[r.status] || { labelKh: r.status };

    let statusEmoji = '✅';
    if (r.status === 'late') statusEmoji = '⏳';
    if (r.status === 'permission') statusEmoji = '📝';
    if (r.status === 'absent') statusEmoji = '❌';
    if (r.status === 'mission') statusEmoji = '💼';
    if (r.status === 'substitute') statusEmoji = '🔄';

    msg += `${toKhmerNumber(idx + 1)}. <b>${r.sessionPeriod}</b>\n`;
    msg += `   • ថ្នាក់៖ <b>${cls}</b> | មុខវិជ្ជា៖ <b>${subj}</b>\n`;
    msg += `   • ស្ថានភាព៖ ${statusEmoji} <b>${statusMeta.labelKh}</b>\n`;
    if (r.lessonTopic) {
      msg += `   • មេរៀន៖ <i>${r.lessonTopic}</i>\n`;
    }
    if (r.reason) {
      msg += `   • មូលហេតុ៖ <i>${r.reason}</i>\n`;
    }
    msg += `\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `<i>📌 ទិន្នន័យត្រូវបានចាក់សោស្វ័យប្រវត្តិដោយប្រព័ន្ធគ្រប់គ្រងវត្តមាន</i>`;
  return msg;
}

// 2. Format Daily Summary Report for Telegram
export function formatDailySummaryMessage(
  school: SchoolInfo,
  dateStr: string,
  records: AttendanceRecord[],
  teachers: Teacher[]
): string {
  const khmerDate = formatKhmerDate(dateStr);
  const totalTeachers = teachers.length;
  
  // Teachers who submitted attendance today
  const submittedTeacherIds = new Set(records.map((r) => r.teacherId));
  const submittedCount = submittedTeacherIds.size;
  
  // Status breakdown across records
  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const permCount = records.filter((r) => r.status === 'permission').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const missionCount = records.filter((r) => r.status === 'mission').length;
  const substituteCount = records.filter((r) => r.status === 'substitute').length;
  const totalSessions = records.length;

  const rate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 0;

  let msg = `<b>🏫 ${school.nameKh || 'សាលារៀន'}</b>\n`;
  msg += `<b>📊 របាយការណ៍សង្ខេបវត្តមានប្រចាំថ្ងៃ</b>\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📅 <b>កាលបរិច្ឆេទ៖</b> ${khmerDate}\n`;
  msg += `👨‍🏫 <b>គ្រូបានចុះវត្តមាន៖</b> ${toKhmerNumber(submittedCount)} / ${toKhmerNumber(totalTeachers)} នាក់\n`;
  msg += `📈 <b>អត្រាវត្តមានរួម៖</b> <b>${toKhmerNumber(rate)}%</b>\n\n`;

  msg += `<b>📌 សរុបម៉ោងបង្រៀន (${toKhmerNumber(totalSessions)} ម៉ោង)៖</b>\n`;
  msg += `  ✅ វត្តមានពេញលេញ៖ <b>${toKhmerNumber(presentCount)}</b> ម៉ោង\n`;
  msg += `  ⏳ មកយឺត៖ <b>${toKhmerNumber(lateCount)}</b> ម៉ោង\n`;
  msg += `  📝 មានច្បាប់៖ <b>${toKhmerNumber(permCount)}</b> ម៉ោង\n`;
  msg += `  ❌ ឥតច្បាប់ (អវត្តមាន)៖ <b>${toKhmerNumber(absentCount)}</b> ម៉ោង\n`;
  msg += `  💼 បេសកកម្ម៖ <b>${toKhmerNumber(missionCount)}</b> ម៉ោង\n`;
  msg += `  🔄 បង្រៀនជំនួស៖ <b>${toKhmerNumber(substituteCount)}</b> ម៉ោង\n\n`;

  // List of teachers with issues (absent or late)
  const problemRecords = records.filter((r) => r.status === 'absent' || r.status === 'permission');
  if (problemRecords.length > 0) {
    msg += `<b>⚠️ គ្រូមានច្បាប់ ឬអវត្តមានថ្ងៃនេះ៖</b>\n`;
    const recordedMap = new Map<string, string>();
    problemRecords.forEach((r) => {
      const t = teachers.find((tc) => tc.id === r.teacherId);
      if (t && !recordedMap.has(t.id)) {
        recordedMap.set(t.id, `${t.nameKh} (${STATUS_META[r.status].labelKh}${r.reason ? ': ' + r.reason : ''})`);
      }
    });
    recordedMap.forEach((val) => {
      msg += `  • ${val}\n`;
    });
    msg += `\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `<i>នាយកសាលា៖ ${school.principalName || 'គណៈគ្រប់គ្រង'}</i>\n`;
  msg += `<i>ប្រព័ន្ធគ្រប់គ្រងវត្តមានគ្រូបង្រៀន</i>`;
  return msg;
}

// 3. Format Leave Request Notification for Telegram
export function formatLeaveRequestMessage(
  school: SchoolInfo,
  teacher: Teacher,
  leave: LeaveRequest
): string {
  let typeKh = 'ការងារផ្ទាល់ខ្លួន';
  if (leave.leaveType === 'sick') typeKh = 'ឈឺ/សម្រាកព្យាបាល';
  if (leave.leaveType === 'mission') typeKh = 'បេសកកម្មផ្លូវការ';
  if (leave.leaveType === 'maternity') typeKh = 'លំហែមាតុភាព';

  let msg = `<b>🏫 ${school.nameKh || 'សាលារៀន'}</b>\n`;
  msg += `<b>📝 ដំណឹងស្នើសុំច្បាប់ឈប់សម្រាកថ្មី</b>\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 <b>គ្រូបង្រៀន៖</b> ${teacher.nameKh} (${teacher.phone})\n`;
  msg += `🏷️ <b>ប្រភេទច្បាប់៖</b> ${typeKh}\n`;
  msg += `📅 <b>ចាប់ពីថ្ងៃ៖</b> ${formatKhmerDate(leave.startDate)}\n`;
  msg += `📅 <b>ដល់ថ្ងៃ៖</b> ${formatKhmerDate(leave.endDate)}\n`;
  msg += `💬 <b>មូលហេតុ៖</b> <i>${leave.reason}</i>\n`;
  msg += `⏳ <b>ស្ថានភាព៖</b> <b>រង់ចាំការអនុម័តពីអ្នកគ្រប់គ្រង</b>\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `<i>សូមអ្នកគ្រប់គ្រងចូលទៅពិនិត្យ និងអនុម័តក្នុងផ្ទាំងគ្រប់គ្រង (Admin Dashboard)</i>`;
  return msg;
}

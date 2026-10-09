export type DomainErrorCode =
  | 'SESSION_REQUIRED'
  | 'CHECKPOINT_NOT_FOUND'
  | 'CHECKPOINT_LOCKED'
  | 'REWARD_ALREADY_CLAIMED'
  | 'PROGRESS_VERSION_MISMATCH';

const DEFAULT_MESSAGES: Record<DomainErrorCode, string> = {
  SESSION_REQUIRED: 'ไม่พบ session ผู้เล่น กรุณาเริ่ม session ก่อน',
  CHECKPOINT_NOT_FOUND: 'ไม่พบ checkpoint ที่ระบุ',
  CHECKPOINT_LOCKED: 'คะแนนสะสมยังไม่ถึงเกณฑ์รับรางวัล',
  REWARD_ALREADY_CLAIMED: 'รับรางวัลของ checkpoint นี้แล้ว',
  PROGRESS_VERSION_MISMATCH: 'ข้อมูลการสะสมเปลี่ยนแล้ว กรุณาโหลดข้อมูลล่าสุด',
};

/** A business rule violation. Independent of HTTP; mapped to a response by the HTTP layer. */
export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string = DEFAULT_MESSAGES[code],
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

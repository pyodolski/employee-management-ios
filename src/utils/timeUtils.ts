/**
 * 근무 시간을 계산합니다 (야간 근무 지원)
 * @param clockIn 출근 시간 (HH:mm 형식)
 * @param clockOut 퇴근 시간 (HH:mm 형식)
 * @param workType 근무 유형 (day_off인 경우 0 반환)
 * @returns 근무 시간 (시간 단위)
 */
export function calculateWorkHours(
  clockIn: string | null,
  clockOut: string | null,
  workType?: string
): number {
  // 휴무인 경우
  if (workType === 'day_off' || !clockIn || !clockOut) {
    return 0;
  }

  // 시간을 분으로 변환
  const [inHour, inMin] = clockIn.split(':').map(Number);
  const [outHour, outMin] = clockOut.split(':').map(Number);

  let inMinutes = inHour * 60 + inMin;
  let outMinutes = outHour * 60 + outMin;

  // 퇴근 시간이 출근 시간보다 이른 경우 (야간 근무)
  // 예: 22:00 ~ 02:00 = 4시간
  if (outMinutes < inMinutes) {
    outMinutes += 24 * 60; // 다음 날로 계산
  }

  const totalMinutes = outMinutes - inMinutes;
  return totalMinutes > 0 ? totalMinutes / 60 : 0;
}

/**
 * 야간 근무인지 확인합니다
 * @param clockIn 출근 시간
 * @param clockOut 퇴근 시간
 * @returns 야간 근무 여부
 */
export function isNightShift(
  clockIn: string | null,
  clockOut: string | null
): boolean {
  if (!clockIn || !clockOut) return false;

  const [inHour] = clockIn.split(':').map(Number);
  const [outHour] = clockOut.split(':').map(Number);

  return outHour < inHour;
}

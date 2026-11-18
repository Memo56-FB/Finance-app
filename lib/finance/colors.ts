export const colorHex: Record<string,string> = {
  green:'#277C78',cyan:'#82C9D7',navy:'#626070',yellow:'#F2CDAC',magenta:'#934F6F',blue:'#3F82B2',
  'navy-gray':'#97A0AC','army-green':'#7F9161',gold:'#CAB361',orange:'#BE6C49',purple:'#826CB0',red:'#C94736',
}
export function safeColor(value: string) { return /^#[\da-f]{6}$/i.test(value) ? value : colorHex[value] ?? '#277C78' }

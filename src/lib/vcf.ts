// lib/vcf.ts
// Generates a .vcf (vCard) file string for download

export function generateVCF(owner: {
  name: string
  title: string
  company: string
  email: string
  phone: string
  website: string
}): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${owner.name}`,
    `N:${owner.name.split(' ').reverse().join(';')};;;`,
    `TITLE:${owner.title}`,
    `ORG:${owner.company}`,
    `EMAIL;TYPE=INTERNET:${owner.email}`,
    `TEL;TYPE=CELL:${owner.phone}`,
    `URL:${owner.website}`,
    'END:VCARD',
  ].join('\r\n')
}

export function downloadVCF(owner: Parameters<typeof generateVCF>[0]) {
  const vcf = generateVCF(owner)
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${owner.name.replace(' ', '_')}.vcf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

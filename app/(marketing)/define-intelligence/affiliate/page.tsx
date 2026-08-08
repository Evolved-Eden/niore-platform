import DefineIntelligenceFlow from '@/components/demo/define-intelligence-flow'

export default async function AffiliatePathPage({ searchParams }: { searchParams?: Promise<{ member?: string }> }) {
  const sp = await searchParams
  return <DefineIntelligenceFlow initialPath="affiliate" member={sp?.member === '1'} />
}

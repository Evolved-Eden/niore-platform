import DefineIntelligenceFlow from '@/components/demo/define-intelligence-flow'

export default async function PersonalPathPage({ searchParams }: { searchParams?: Promise<{ member?: string }> }) {
  const sp = await searchParams
  return <DefineIntelligenceFlow initialPath="personal" member={sp?.member === '1'} />
}

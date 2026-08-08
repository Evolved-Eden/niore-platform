import DefineIntelligenceFlow from '@/components/demo/define-intelligence-flow'

export default async function CreatorPathPage({ searchParams }: { searchParams?: Promise<{ member?: string }> }) {
  const sp = await searchParams
  return <DefineIntelligenceFlow initialPath="creator" member={sp?.member === '1'} />
}

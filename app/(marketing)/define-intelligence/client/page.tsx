import DefineIntelligenceFlow from '@/components/demo/define-intelligence-flow'

export default async function ClientPathPage({ searchParams }: { searchParams?: Promise<{ member?: string }> }) {
  const sp = await searchParams
  return <DefineIntelligenceFlow initialPath="client" member={sp?.member === '1'} />
}

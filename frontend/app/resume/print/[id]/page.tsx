import PrintCanvas from "./PrintCanvas";

interface PageProps {
  params: {
    id: string;
  };
  searchParams: {
    token?: string;
  };
}

export default function PrintResumePage({ params, searchParams }: PageProps) {
  const { id } = params;
  const token = searchParams?.token || "";

  return <PrintCanvas id={id} token={token} />;
}

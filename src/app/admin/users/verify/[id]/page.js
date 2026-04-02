"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import * as nextui from "@nextui-org/react";
import * as icons from "lucide-react";

/**
 * Mock function to simulate fetching verification details.
 * In a real app, this would be an API call to your backend.
 */
async function getVerificationSummary(id) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return {
    id,
    user: {
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      phone: "+91 9876543210",
      dob: "1990-05-15",
    },
    status: "pending",
    created_at: new Date().toISOString(),
    metadata: {
      aadhar_number: "XXXX-XXXX-1234",
      pan_number: "ABCDE1234F",
    },
    verification_results: {
      "Identity (Aadhar)": "verified",
      "PAN Card": "verified",
      "Email Address": "verified",
      "Phone Number": "pending",
      "Criminal Record": "clean",
      "Address Proof": "flagged",
    },
  };
}

const { 
  Card, 
  CardBody, 
  CardHeader, 
  User, 
  Button, 
  Chip, 
  Divider,
  Breadcrumbs,
  BreadcrumbItem,
  Tooltip
} = nextui;

const { 
  MoreVertical, 
  BadgeInfo, 
  CheckCircle2, 
  CircleOff, 
  Trash2, 
  Printer, 
  CheckCheck, 
  RefreshCw,
  ChevronLeft,
  XCircle,
  AlertCircle
} = icons;

const StatusChip = ({ status }) => {
  switch (status?.toLowerCase()) {
    case 'verified':
    case 'clean':
      return <Chip color="success" variant="flat" size="sm" startContent={<CheckCircle2 size={12} />}>Verified</Chip>;
    case 'pending':
      return <Chip color="warning" variant="flat" size="sm" startContent={<RefreshCw size={12} className="animate-spin" />}>Pending</Chip>;
    case 'flagged':
      return <Chip color="danger" variant="flat" size="sm" startContent={<AlertCircle size={12} />}>Flagged</Chip>;
    default:
      return <Chip color="default" variant="flat" size="sm">{status}</Chip>;
  }
};

const DetailRow = ({ title, content }) => (
  <div className="flex border-b py-3 px-1 dark:border-default-100 last:border-0 items-center">
    <p className="font-semibold text-xs min-w-[150px] uppercase text-default-500">
      {title}
    </p>
    <div className="flex-1 text-sm font-medium text-default-800">
      {content || "N/A"}
    </div>
  </div>
);

export default function CheckDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reverifying, setReverifying] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVerificationSummary(id);
      setSummary(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleAction = async (action) => {
    // In real app, call API to update status
    console.log(`Action: ${action} for ID: ${id}`);
    alert(`${action} successful (Mock)`);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
        <nextui.Spinner size="lg" color="primary" label="Fetching Verification Data..." />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <AlertCircle size={48} className="mx-auto text-danger mb-4" />
        <h2 className="text-xl font-bold">Verification Not Found</h2>
        <p className="text-default-500 mt-2">The record you are looking for might have been deleted or moved.</p>
        <Button className="mt-6" onPress={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const { user, verification_results, metadata } = summary;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem href="/admin/dashboard">Dashboard</BreadcrumbItem>
            <BreadcrumbItem href="/admin/users/verify">Verifications</BreadcrumbItem>
            <BreadcrumbItem>Details</BreadcrumbItem>
          </Breadcrumbs>
          <div className="flex items-center gap-3">
             <Button isIconOnly variant="flat" radius="full" size="sm" onPress={() => router.back()}>
                <ChevronLeft size={18} />
             </Button>
             <h1 className="text-2xl font-bold tracking-tight">Verification Profile</h1>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            className="flex-1"
            color="danger" 
            variant="flat" 
            startContent={<XCircle size={18} />}
            onPress={() => handleAction('Reject')}
          >
            Reject
          </Button>
          <Button 
            className="flex-1"
            color="primary" 
            variant="solid" 
            startContent={<CheckCheck size={18} />}
            onPress={() => handleAction('Approve')}
          >
            Approve
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-premium">
            <CardBody className="p-6 text-center">
              <nextui.Avatar 
                src={user?.avatar || ""} 
                name={`${user?.first_name} ${user?.last_name}`}
                className="w-24 h-24 text-large mx-auto mb-4 border-2 border-primary" 
              />
              <h3 className="text-xl font-bold">{user?.first_name} {user?.last_name}</h3>
              <p className="text-default-500 text-sm mb-4">{user?.email}</p>
              <Chip color="warning" variant="dot" className="capitalize">{summary.status}</Chip>
              
              <Divider className="my-6" />
              
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <icons.Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-default-400">Phone</p>
                    <p className="text-sm font-medium">{user?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                    <icons.Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-default-400">Date of Birth</p>
                    <p className="text-sm font-medium">{user?.dob}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex flex-col gap-2">
            <Button variant="light" color="default" startContent={<Printer size={18} />} className="justify-start">Print Report</Button>
            <Button variant="light" color="primary" startContent={<RefreshCw size={18} />} className="justify-start">Run All Re-verifications</Button>
            <Button variant="light" color="danger" startContent={<Trash2 size={18} />} className="justify-start">Delete Record</Button>
          </div>
        </div>

        {/* Right Column - Verification Stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-premium">
            <CardHeader className="flex gap-3 px-6 pt-6">
               <BadgeInfo className="text-primary" />
               <h4 className="font-bold">Identity & Compliance</h4>
            </CardHeader>
            <CardBody className="px-6 pb-6">
               <div className="space-y-1">
                  <DetailRow title="Aadhar Number" content={metadata?.aadhar_number} />
                  <DetailRow title="PAN Number" content={metadata?.pan_number} />
                  <DetailRow title="Submitted On" content={new Date(summary.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })} />
               </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-premium">
            <CardHeader className="flex gap-3 px-6 pt-6">
               <CheckCircle2 className="text-success" />
               <h4 className="font-bold">Verification Results</h4>
            </CardHeader>
            <CardBody className="px-6 pb-6 p-0">
               <table className="w-full text-left">
                  <thead>
                    <tr className="border-b dark:border-default-100 bg-default-50 dark:bg-default-50/50">
                      <th className="py-3 px-4 text-xs font-bold uppercase text-default-500">Checkpoint</th>
                      <th className="py-3 px-4 text-xs font-bold uppercase text-default-500">Status</th>
                      <th className="py-3 px-4 text-xs font-bold uppercase text-default-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-default-100">
                    {Object.entries(verification_results || {}).map(([key, value]) => (
                      <tr key={key} className="hover:bg-default-50/50 transition-colors">
                        <td className="py-4 px-4 text-sm font-medium">{key}</td>
                        <td className="py-4 px-4"><StatusChip status={value} /></td>
                        <td className="py-4 px-4 text-right">
                          <Tooltip content="Re-verify this specific item">
                            <Button isIconOnly variant="light" size="sm" color="primary">
                              <RefreshCw size={14} />
                            </Button>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

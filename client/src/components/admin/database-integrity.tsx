import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  RefreshCw,
  Wrench,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface IntegrityIssue {
  severity: 'error' | 'warning' | 'info';
  table: string;
  type: 'orphaned' | 'invalid_reference' | 'data_inconsistency' | 'missing_data';
  description: string;
  recordId: number | string;
  details?: any;
  fixAction?: string;
}

interface IntegrityReport {
  timestamp: string;
  summary: {
    totalIssues: number;
    orphanedRecords: number;
    invalidReferences: number;
    dataInconsistencies: number;
  };
  issues: IntegrityIssue[];
  recommendations: string[];
}

export default function DatabaseIntegrity() {
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const { toast } = useToast();

  const { 
    data: integrityReport, 
    isLoading, 
    error,
    refetch: refetchIntegrity
  } = useQuery<IntegrityReport>({
    queryKey: ["/api/admin/integrity-check"],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const runCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/integrity-check");
      if (!response.ok) throw new Error("Failed to run integrity check");
      return response.json();
    },
    onSuccess: (data: IntegrityReport) => {
      setLastCheckTime(data.timestamp);
      queryClient.setQueryData(["/api/admin/integrity-check"], data);
      toast({
        title: "Integrity check completed",
        description: `Found ${data.summary.totalIssues} issues`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to run integrity check",
        variant: "destructive",
      });
    },
  });

  const autoFixMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/integrity-fix", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to run auto-fix");
      return response.json();
    },
    onSuccess: (data: any) => {
      setLastCheckTime(data.finalReport.timestamp);
      queryClient.setQueryData(["/api/admin/integrity-check"], data.finalReport);
      toast({
        title: "Auto-fix completed",
        description: `Fixed ${data.fixedCount} issues`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to run auto-fix",
        variant: "destructive",
      });
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'error':
        return "destructive";
      case 'warning':
        return "secondary";
      case 'info':
        return "outline";
      default:
        return "outline";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Database Integrity
          </h2>
          <p className="text-muted-foreground">
            Monitor and maintain database consistency and data quality
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => runCheckMutation.mutate()}
            disabled={runCheckMutation.isPending}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${runCheckMutation.isPending ? 'animate-spin' : ''}`} />
            {runCheckMutation.isPending ? 'Checking...' : 'Run Check'}
          </Button>
          {integrityReport && integrityReport.summary.totalIssues > 0 && (
            <Button
              onClick={() => autoFixMutation.mutate()}
              disabled={autoFixMutation.isPending}
              variant="default"
            >
              <Wrench className={`h-4 w-4 mr-2 ${autoFixMutation.isPending ? 'animate-spin' : ''}`} />
              {autoFixMutation.isPending ? 'Fixing...' : 'Auto-Fix'}
            </Button>
          )}
        </div>
      </div>

      {lastCheckTime && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last checked: {formatTimestamp(lastCheckTime)}
        </div>
      )}

      {/* Summary Cards */}
      {integrityReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={integrityReport.summary.totalIssues === 0 ? "border-green-200 bg-green-50" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {integrityReport.summary.totalIssues === 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                Total Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrityReport.summary.totalIssues}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Orphaned Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {integrityReport.summary.orphanedRecords}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Invalid References</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {integrityReport.summary.invalidReferences}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Data Inconsistencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {integrityReport.summary.dataInconsistencies}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {integrityReport && integrityReport.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {integrityReport.recommendations.map((recommendation, index) => (
              <Alert key={index}>
                <AlertDescription>{recommendation}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Detailed Issues */}
      {integrityReport && integrityReport.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrityReport.issues.map((issue, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(issue.severity)}
                      <Badge variant={getSeverityBadgeVariant(issue.severity)}>
                        {issue.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{issue.table}</Badge>
                      <Badge variant="outline">{issue.type.replace('_', ' ')}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Record: {String(issue.recordId)}
                    </span>
                  </div>
                  <p className="text-sm">{issue.description}</p>
                  {issue.fixAction && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Fix:</strong> {issue.fixAction}
                    </p>
                  )}
                  {issue.details && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Details:</strong> {JSON.stringify(issue.details)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Issues Message */}
      {integrityReport && integrityReport.summary.totalIssues === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Database Integrity Excellent
              </h3>
              <p className="text-green-700">
                No issues found. Your database is healthy and consistent.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {(isLoading || runCheckMutation.isPending) && !integrityReport && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Running integrity check...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load integrity report. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Initial State */}
      {!integrityReport && !isLoading && !error && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Database Integrity Check
              </h3>
              <p className="text-muted-foreground mb-4">
                Click "Run Check" to verify database consistency and identify any issues.
              </p>
              <Button onClick={() => runCheckMutation.mutate()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Integrity Check
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
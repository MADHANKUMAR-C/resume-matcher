import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Comparison() {
  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle>Gemini API vs. Ollama Comparison</CardTitle>
        <CardDescription>Understanding the key differences between online and offline AI solutions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feature</TableHead>
              <TableHead>Google Gemini API</TableHead>
              <TableHead>Ollama (Llama 3)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Internet Required</TableCell>
              <TableCell>Yes</TableCell>
              <TableCell>No</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>API Key</TableCell>
              <TableCell>Required</TableCell>
              <TableCell>Not required</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Data Privacy</TableCell>
              <TableCell>Data sent to Google servers</TableCell>
              <TableCell>All data stays local</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Cost</TableCell>
              <TableCell>Usage-based pricing</TableCell>
              <TableCell>Free</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Performance</TableCell>
              <TableCell>High (cloud-based)</TableCell>
              <TableCell>Depends on local hardware</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Setup Complexity</TableCell>
              <TableCell>Simple (API key only)</TableCell>
              <TableCell>Moderate (local installation)</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

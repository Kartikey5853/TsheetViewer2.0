import type { StudentSummary } from "@/types/apiTypes";

interface StudentTableProps {
  students: StudentSummary[];
  onSelect: (rollNo: string) => void;
}

export default function StudentTable({ students, onSelect }: StudentTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Roll No</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">SGPA</th>
            <th className="px-4 py-3">CGPA</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.roll_no}
              onClick={() => onSelect(student.roll_no)}
              className="cursor-pointer border-t border-border transition hover:bg-accent/40"
            >
              <td className="px-4 py-3 font-medium">{student.roll_no}</td>
              <td className="px-4 py-3">{student.name}</td>
              <td className="px-4 py-3">{student.status}</td>
              <td className="px-4 py-3">{student.sgpa.toFixed(2)}</td>
              <td className="px-4 py-3">{student.cgpa.toFixed(2)}</td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

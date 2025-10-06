'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface StudentGrade {
  githubUsername: string;
  rosterIdentifier: string;
  assignmentName: string;
  pointsAwarded: number;
  maxPoints: number;
  submissionTimestamp: string;
}

interface StudentSummary {
  name: string;
  assignments: { [assignmentName: string]: { points: number; maxPoints: number } };
  totalPercentage: number;
  hasPassed: boolean;
}

export default function GradeManager() {
  const [students, setStudents] = useState<{ [studentName: string]: StudentSummary }>({});
  const [assignments, setAssignments] = useState<string[]>([]);

  const processCSV = useCallback((csvContent: string, fileName: string) => {
    const lines = csvContent.split('\n');
    
    // Extract assignment name from filename
    const assignmentName = fileName.replace('-grades-', ' ').replace('.csv', '').replace(/^\d+/, '').trim();
    
    let maxPointsForAssignment = 0;
    const grades: StudentGrade[] = [];

    // Parse CSV data
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
      const pointsAwarded = parseInt(values[8]) || 0;
      const githubUsername = values[3];
      const rosterIdentifier = values[4];
      
      if (pointsAwarded > maxPointsForAssignment) {
        maxPointsForAssignment = pointsAwarded;
      }

      grades.push({
        githubUsername,
        rosterIdentifier,
        assignmentName,
        pointsAwarded,
        maxPoints: maxPointsForAssignment,
        submissionTimestamp: values[7]
      });
    }

    // Update max points for all grades
    grades.forEach(grade => grade.maxPoints = maxPointsForAssignment);

    setStudents(prev => {
      const updated = { ...prev };
      
      grades.forEach(grade => {
        const studentName = grade.rosterIdentifier || grade.githubUsername;
        
        if (!updated[studentName]) {
          updated[studentName] = {
            name: studentName,
            assignments: {},
            totalPercentage: 0,
            hasPassed: false
          };
        }

        updated[studentName].assignments[assignmentName] = {
          points: grade.pointsAwarded,
          maxPoints: grade.maxPoints
        };
      });

      // Recalculate totals and pass status
      Object.keys(updated).forEach(studentName => {
        const student = updated[studentName];
        const assignmentKeys = Object.keys(student.assignments);
        
        if (assignmentKeys.length > 0) {
          const totalEarned = assignmentKeys.reduce((sum, key) => 
            sum + student.assignments[key].points, 0);
          const totalPossible = assignmentKeys.reduce((sum, key) => 
            sum + student.assignments[key].maxPoints, 0);
          
          student.totalPercentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
          student.hasPassed = assignmentKeys.every(key => 
            student.assignments[key].points === student.assignments[key].maxPoints);
        }
      });

      return updated;
    });

    setAssignments(prev => {
      const newAssignments = [...prev];
      if (!newAssignments.includes(assignmentName)) {
        newAssignments.push(assignmentName);
      }
      return newAssignments.sort();
    });
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const csvContent = reader.result as string;
        processCSV(csvContent, file.name);
      };
      reader.readAsText(file);
    });
  }, [processCSV]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    }
  });

  const clearData = () => {
    setStudents({});
    setAssignments([]);
  };

  const studentList = Object.values(students).sort((a, b) => a.name.localeCompare(b.name));

  // Calculate statistics
  const totalStudents = studentList.length;
  const perfectStudents = studentList.filter(s => s.hasPassed).length;
  const overallAverage = totalStudents > 0
    ? studentList.reduce((sum, s) => sum + s.totalPercentage, 0) / totalStudents
    : 0;

  // Per-assignment statistics
  const assignmentStats = assignments.map(assignmentName => {
    const studentsWithAssignment = studentList.filter(s => s.assignments[assignmentName]);
    const perfectCount = studentsWithAssignment.filter(s => {
      const grade = s.assignments[assignmentName];
      return grade && grade.points === grade.maxPoints;
    }).length;

    return {
      name: assignmentName,
      total: studentsWithAssignment.length,
      perfect: perfectCount,
      percentage: studentsWithAssignment.length > 0
        ? (perfectCount / studentsWithAssignment.length) * 100
        : 0
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📊 Grade Manager</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <div className="text-4xl">📁</div>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive 
                  ? 'Drop CSV files here...' 
                  : 'Drag & drop CSV files here, or click to select'}
              </p>
              <p className="text-sm text-gray-500">
                Upload GitHub Classroom grade CSV files
              </p>
            </div>
          </div>
          
          {assignments.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                📋 Loaded {assignments.length} assignment(s), {studentList.length} student(s)
              </p>
              <button
                onClick={clearData}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                🗑️ Clear All Data
              </button>
            </div>
          )}
        </div>

        {studentList.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                      👤 Student
                    </th>
                    {assignments.map(assignment => (
                      <th key={assignment} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        📝 {assignment}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📊 Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ✅ Pass
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentList.map(student => (
                    <tr key={student.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        {student.name}
                      </td>
                      {assignments.map(assignment => {
                        const grade = student.assignments[assignment];
                        if (!grade) {
                          return (
                            <td key={assignment} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              -
                            </td>
                          );
                        }
                        
                        const percentage = grade.maxPoints > 0 ? (grade.points / grade.maxPoints) * 100 : 0;
                        const bgColor = percentage === 100 ? 'bg-green-100 text-green-800' : 
                                       percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                                       'bg-red-100 text-red-800';
                        
                        return (
                          <td key={assignment} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
                              {grade.points}/{grade.maxPoints}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.totalPercentage === 100 ? 'bg-green-100 text-green-800' :
                          student.totalPercentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {student.totalPercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {student.hasPassed && (
                          <span className="text-green-600 text-xl">✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-gray-500 text-xs uppercase">Perfect Students</div>
                    <div className="text-lg font-bold text-green-600">
                      🎯 {perfectStudents}/{totalStudents} ({((perfectStudents / totalStudents) * 100).toFixed(1)}%)
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-gray-500 text-xs uppercase">Overall Average</div>
                    <div className="text-lg font-bold text-blue-600">
                      📈 {overallAverage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-gray-500 text-xs uppercase">Total Assignments</div>
                    <div className="text-lg font-bold text-purple-600">
                      📝 {assignments.length}
                    </div>
                  </div>
                </div>

                {assignmentStats.length > 0 && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-gray-700 text-xs uppercase font-semibold mb-2">
                      Per-assignment completion rates:
                    </div>
                    <div className="space-y-1">
                      {assignmentStats.map(stat => (
                        <div key={stat.name} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700">{stat.name}</span>
                          <span className="text-gray-600">
                            {stat.perfect}/{stat.total} perfect ({stat.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
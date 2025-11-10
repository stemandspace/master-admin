import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileJson,
  Save,
} from 'lucide-react'
import Papa from 'papaparse'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Mock data types
interface QuizStatus {
  easy: boolean
  medium: boolean
  hard: boolean
}

interface UpcomingQuiz {
  date: string
  easy: boolean
  medium: boolean
  hard: boolean
  status: 'Scheduled' | 'Missing' | 'Uploaded'
}

// Mock data for quizzes with dates
const mockQuizDates: Record<string, QuizStatus> = {
  '2025-03-15': { easy: true, medium: true, hard: false },
  '2025-03-16': { easy: true, medium: false, hard: true },
  '2025-03-17': { easy: true, medium: true, hard: true },
  '2025-03-18': { easy: false, medium: false, hard: false },
  '2025-03-20': { easy: true, medium: true, hard: true },
  '2025-03-22': { easy: true, medium: false, hard: false },
}

// Mock data for upcoming quizzes
const mockUpcomingQuizzes: UpcomingQuiz[] = [
  {
    date: '2025-03-25',
    easy: true,
    medium: true,
    hard: true,
    status: 'Uploaded',
  },
  {
    date: '2025-03-26',
    easy: true,
    medium: false,
    hard: false,
    status: 'Missing',
  },
  {
    date: '2025-03-27',
    easy: false,
    medium: false,
    hard: false,
    status: 'Missing',
  },
  {
    date: '2025-03-28',
    easy: true,
    medium: true,
    hard: true,
    status: 'Scheduled',
  },
  {
    date: '2025-03-29',
    easy: false,
    medium: false,
    hard: false,
    status: 'Scheduled',
  },
]

// Mock analytics data
const mockWeeklyData = [
  { day: 'Mon', attempts: 1250 },
  { day: 'Tue', attempts: 1890 },
  { day: 'Wed', attempts: 2100 },
  { day: 'Thu', attempts: 1750 },
  { day: 'Fri', attempts: 2300 },
  { day: 'Sat', attempts: 1950 },
  { day: 'Sun', attempts: 1680 },
]

const mockMonthlyData = [
  { week: 'Week 1', attempts: 8500 },
  { week: 'Week 2', attempts: 9200 },
  { week: 'Week 3', attempts: 11000 },
  { week: 'Week 4', attempts: 9800 },
]

export function DailyQuizManager() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [toDate, setToDate] = useState<Date | undefined>(undefined)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [jsonData, setJsonData] = useState<{
    easy: any[]
    medium: any[]
    difficult: any[]
    dateWise?: Array<{
      date: string
      easy: any[]
      medium: any[]
      difficult: any[]
    }>
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [rowCount, setRowCount] = useState<number>(0)

  // Debug: Log jsonData changes
  useEffect(() => {
    console.log('jsonData state changed:', jsonData)
    if (jsonData?.dateWise) {
      console.log('dateWise length:', jsonData.dateWise.length)
      console.log('dateWise data:', jsonData.dateWise)
    }
  }, [jsonData])

  // Get quiz status for a specific date
  const getQuizStatus = (date: Date): QuizStatus | null => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return mockQuizDates[dateKey] || null
  }

  // Check if date has any quizzes
  const hasQuizzes = (date: Date): boolean => {
    const status = getQuizStatus(date)
    return status !== null
  }

  // Calculate to date based on from date and row count
  const calculateToDate = (startDate: Date, rows: number): Date => {
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + rows - 1)
    return endDate
  }

  // Helper function to trim string values and remove empty padding
  const cleanValue = (value: any): any => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return value
  }

  // Validate and clean quiz row data
  const validateAndCleanQuizRow = (
    row: any
  ): {
    isValid: boolean
    cleanedRow: any
    errors: string[]
  } => {
    const errors: string[] = []
    const cleanedRow: any = {}

    // Required base fields
    const requiredFields = ['type', 'title', 'desc', 'variable_score']
    for (const field of requiredFields) {
      const cleanedValue = cleanValue(row[field])
      if (
        !cleanedValue ||
        (typeof cleanedValue === 'string' && cleanedValue === '')
      ) {
        errors.push(`Missing required field: ${field}`)
      } else {
        cleanedRow[field] = cleanedValue
      }
    }

    // Validate and extract questions (maximum 3 questions)
    const maxQuestions = 3
    const questionNumbers: number[] = []

    // Find all question numbers in the row
    for (const key in row) {
      const match = key.match(/^question\s*(\d+)$/i)
      if (match) {
        const qNum = parseInt(match[1], 10)
        if (!questionNumbers.includes(qNum)) {
          questionNumbers.push(qNum)
        }
      }
    }

    // Sort question numbers and limit to max 3
    questionNumbers.sort((a, b) => a - b)
    const validQuestionNumbers = questionNumbers.slice(0, maxQuestions)

    // Validate each question (up to 3)
    for (const qNum of validQuestionNumbers) {
      const questionKey = `question ${qNum}`
      const option1Key = `question ${qNum} option 1`
      const option2Key = `question ${qNum} option 2`
      const option3Key = `question ${qNum} option 3`
      const option4Key = `question ${qNum} option 4`
      const answerKey = `question ${qNum} answer`

      // Check if question exists
      const cleanedQuestion = cleanValue(row[questionKey])
      if (
        !cleanedQuestion ||
        (typeof cleanedQuestion === 'string' && cleanedQuestion === '')
      ) {
        errors.push(`Missing required field: ${questionKey}`)
        continue
      }

      // Check all options
      const options = [
        { key: option1Key, num: 1 },
        { key: option2Key, num: 2 },
        { key: option3Key, num: 3 },
        { key: option4Key, num: 4 },
      ]

      let hasAllOptions = true
      for (const opt of options) {
        const cleanedOption = cleanValue(row[opt.key])
        if (
          !cleanedOption ||
          (typeof cleanedOption === 'string' && cleanedOption === '')
        ) {
          errors.push(`Missing required field: ${opt.key} for question ${qNum}`)
          hasAllOptions = false
        }
      }

      // Check answer
      const cleanedAnswer = cleanValue(row[answerKey])
      if (
        !cleanedAnswer ||
        (typeof cleanedAnswer === 'string' && cleanedAnswer === '')
      ) {
        errors.push(`Missing required field: ${answerKey} for question ${qNum}`)
      }

      // If question is valid, add it to cleaned row with trimmed values
      if (hasAllOptions && cleanedAnswer) {
        cleanedRow[questionKey] = cleanedQuestion
        cleanedRow[option1Key] = cleanValue(row[option1Key])
        cleanedRow[option2Key] = cleanValue(row[option2Key])
        cleanedRow[option3Key] = cleanValue(row[option3Key])
        cleanedRow[option4Key] = cleanValue(row[option4Key])
        cleanedRow[answerKey] = cleanedAnswer
      }
    }

    // Copy all other fields that are not questions (beyond question 3)
    // Trim all string values to remove empty padding
    for (const key in row) {
      if (!key.match(/^question\s*\d+/i)) {
        if (!cleanedRow[key]) {
          cleanedRow[key] = cleanValue(row[key])
        }
      } else {
        // Check if this is a question beyond question 3
        const match = key.match(/^question\s*(\d+)/i)
        if (match) {
          const qNum = parseInt(match[1], 10)
          if (qNum > maxQuestions && !cleanedRow[key]) {
            // Skip questions beyond question 3
            continue
          }
        }
      }
    }

    const isValid = errors.length === 0 && validQuestionNumbers.length > 0

    return {
      isValid,
      cleanedRow,
      errors,
    }
  }

  // Handle file selection and process CSV to JSON
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!selectedDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a date from the calendar first.',
      })
      return
    }

    setCsvFile(file)
    setIsProcessing(true)
    setJsonData(null)
    setRowCount(0)
    setToDate(undefined)

    // Read and parse CSV file
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Convert parsed data to JSON
          const jsonResult = results.data as any[]

          console.log('CSV parsed, total rows:', jsonResult.length)
          console.log('First few rows:', jsonResult.slice(0, 3))

          if (!jsonResult || jsonResult.length === 0) {
            setIsProcessing(false)
            toast({
              variant: 'destructive',
              title: 'Empty CSV',
              description:
                'The CSV file appears to be empty or has no valid data.',
            })
            return
          }

          // Process CSV data: use type column to determine quiz type
          // Group rows by date and type (Easy, Medium, Difficult)
          if (!selectedDate) {
            setIsProcessing(false)
            toast({
              variant: 'destructive',
              title: 'Date Required',
              description: 'Please select a date from the calendar first.',
            })
            return
          }

          // First, validate and clean all rows
          const validationResults: Array<{
            originalRow: any
            validation: ReturnType<typeof validateAndCleanQuizRow>
            rowIndex: number
          }> = []

          jsonResult.forEach((row: any, index: number) => {
            const validation = validateAndCleanQuizRow(row)
            validationResults.push({
              originalRow: row,
              validation,
              rowIndex: index + 1, // 1-based index for user-friendly error messages
            })
          })

          // Separate valid and invalid rows
          const validRows: any[] = []
          const invalidRows: Array<{
            rowIndex: number
            errors: string[]
            row: any
          }> = []

          validationResults.forEach((result) => {
            if (result.validation.isValid) {
              validRows.push(result.validation.cleanedRow)
            } else {
              invalidRows.push({
                rowIndex: result.rowIndex,
                errors: result.validation.errors,
                row: result.originalRow,
              })
            }
          })

          // Log validation results
          if (invalidRows.length > 0) {
            console.warn('Invalid rows found:', invalidRows)
            toast({
              variant: 'destructive',
              title: 'Validation Warnings',
              description: `${invalidRows.length} row(s) have validation errors. Check console for details.`,
            })
          }

          // Group valid rows by their type (from type column)
          const rowsByType: {
            easy: any[]
            medium: any[]
            difficult: any[]
          } = {
            easy: [],
            medium: [],
            difficult: [],
          }

          validRows.forEach((row: any) => {
            // Get type from type column (check multiple possible column names)
            const type = (
              row.type ||
              row.Type ||
              row.TYPE ||
              row.difficulty ||
              row.Difficulty ||
              row.quizType ||
              row.QuizType ||
              ''
            )
              .toString()
              .toLowerCase()
              .trim()

            // Categorize based on type
            if (type === 'easy' || type === 'e' || type.includes('easy')) {
              rowsByType.easy.push(row)
            } else if (
              type === 'medium' ||
              type === 'm' ||
              type.includes('medium')
            ) {
              rowsByType.medium.push(row)
            } else if (
              type === 'difficult' ||
              type === 'hard' ||
              type === 'd' ||
              type === 'h' ||
              type.includes('difficult') ||
              type.includes('hard')
            ) {
              rowsByType.difficult.push(row)
            } else {
              // If type is not recognized, log warning
              console.warn('Unknown quiz type:', type, 'in row:', row)
            }
          })

          console.log('Rows by type:', {
            easy: rowsByType.easy.length,
            medium: rowsByType.medium.length,
            difficult: rowsByType.difficult.length,
          })

          // Calculate number of days based on the maximum count of any type
          // Each day needs 1 Easy, 1 Medium, 1 Difficult
          const maxCount = Math.max(
            rowsByType.easy.length,
            rowsByType.medium.length,
            rowsByType.difficult.length
          )
          const numberOfDays = maxCount

          // Organize data by date: distribute rows across days
          const dateWiseData: Array<{
            date: string
            easy: any[]
            medium: any[]
            difficult: any[]
          }> = []

          for (let dayIndex = 0; dayIndex < numberOfDays; dayIndex++) {
            // Calculate date for this day
            const dayDate = new Date(selectedDate)
            dayDate.setDate(dayDate.getDate() + dayIndex)
            const dateKey = format(dayDate, 'yyyy-MM-dd')

            // Get one row of each type for this day
            const easyRow = rowsByType.easy[dayIndex] || null
            const mediumRow = rowsByType.medium[dayIndex] || null
            const difficultRow = rowsByType.difficult[dayIndex] || null

            dateWiseData.push({
              date: dateKey,
              easy: easyRow ? [easyRow] : [],
              medium: mediumRow ? [mediumRow] : [],
              difficult: difficultRow ? [difficultRow] : [],
            })
          }

          const totalRows = jsonResult.length
          const validCount = validRows.length
          console.log('Processed dateWiseArray:', dateWiseData)
          console.log('Number of dates:', dateWiseData.length)
          console.log('Total rows:', totalRows, 'Valid rows:', validCount)

          setJsonData({
            easy: [],
            medium: [],
            difficult: [],
            dateWise: dateWiseData,
          })
          setRowCount(validCount)

          // Calculate to date based on selected date and number of days
          if (selectedDate && numberOfDays > 0) {
            const calculatedToDate = calculateToDate(selectedDate, numberOfDays)
            setToDate(calculatedToDate)
          }

          setIsProcessing(false)

          // Get the calculated to date for the toast message
          const finalCalculatedToDate =
            selectedDate && numberOfDays > 0
              ? calculateToDate(selectedDate, numberOfDays)
              : null

          const invalidCount = invalidRows.length

          toast({
            title:
              invalidCount > 0
                ? 'CSV Processed with Warnings'
                : 'CSV Processed Successfully',
            description: `Processed ${validCount} valid row(s)${invalidCount > 0 ? `, ${invalidCount} invalid row(s) skipped` : ''}: ${rowsByType.easy.length} Easy, ${rowsByType.medium.length} Medium, ${rowsByType.difficult.length} Difficult. Organized across ${numberOfDays} date(s). Date range: ${format(selectedDate!, 'MMM d, yyyy')} to ${finalCalculatedToDate ? format(finalCalculatedToDate, 'MMM d, yyyy') : 'N/A'}.`,
            variant: invalidCount > 0 ? 'destructive' : 'default',
          })
        } catch (error) {
          console.error('Error processing CSV:', error)
          setIsProcessing(false)
          toast({
            variant: 'destructive',
            title: 'Error Processing CSV',
            description:
              error instanceof Error
                ? error.message
                : 'Failed to process CSV file.',
          })
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error)
        setIsProcessing(false)
        toast({
          variant: 'destructive',
          title: 'Error Parsing CSV',
          description: error.message || 'Failed to parse CSV file.',
        })
      },
    })
  }

  // Update to date when selected date changes (if CSV is already loaded)
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && rowCount > 0) {
      const calculatedToDate = calculateToDate(date, rowCount)
      setToDate(calculatedToDate)
    } else {
      setToDate(undefined)
    }
  }

  // Transform a single quiz row from CSV format to API format
  const transformQuizRowToAPIFormat = (
    row: any,
    publishDate: string,
    difficulty: string
  ) => {
    const questions: Array<{
      name: string
      option1: string
      option2: string
      option3: string
      option4: string
      answer: string
    }> = []

    // Extract questions (up to 3 questions based on validation)
    for (let qNum = 1; qNum <= 3; qNum++) {
      const questionKey = `question ${qNum}`
      const option1Key = `question ${qNum} option 1`
      const option2Key = `question ${qNum} option 2`
      const option3Key = `question ${qNum} option 3`
      const option4Key = `question ${qNum} option 4`
      const answerKey = `question ${qNum} answer`

      const questionName = row[questionKey]
      if (
        questionName &&
        row[option1Key] &&
        row[option2Key] &&
        row[option3Key] &&
        row[option4Key] &&
        row[answerKey]
      ) {
        questions.push({
          name: String(questionName).trim(),
          option1: String(row[option1Key]).trim(),
          option2: String(row[option2Key]).trim(),
          option3: String(row[option3Key]).trim(),
          option4: String(row[option4Key]).trim(),
          answer: String(row[answerKey]).trim(),
        })
      }
    }

    return {
      title: String(row.title || '').trim(),
      description: String(row.desc || row.description || '').trim(),
      variable_score: Number(row.variable_score) || 100,
      publish_date: publishDate,
      difficulty: difficulty.toLowerCase(),
      questions,
    }
  }

  // Save quiz data to backend
  const saveToBackend = async () => {
    if (!jsonData || !jsonData.dateWise || jsonData.dateWise.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data to Save',
        description: 'Please process a CSV file first.',
      })
      return
    }

    if (!selectedDate) {
      toast({
        variant: 'destructive',
        title: 'Date Required',
        description: 'Please select a date from the calendar.',
      })
      return
    }

    setIsSaving(true)

    try {
      // Transform data to match API format
      const quizzes: Array<{
        title: string
        description: string
        variable_score: number
        publish_date: string
        difficulty: string
        questions: Array<{
          name: string
          option1: string
          option2: string
          option3: string
          option4: string
          answer: string
        }>
      }> = []

      // Process each date's quizzes
      jsonData.dateWise.forEach((dateData) => {
        // Add easy quiz if exists
        if (dateData.easy.length > 0) {
          const easyQuiz = transformQuizRowToAPIFormat(
            dateData.easy[0],
            dateData.date,
            'easy'
          )
          if (easyQuiz.questions.length > 0) {
            quizzes.push(easyQuiz)
          }
        }

        // Add medium quiz if exists
        if (dateData.medium.length > 0) {
          const mediumQuiz = transformQuizRowToAPIFormat(
            dateData.medium[0],
            dateData.date,
            'medium'
          )
          if (mediumQuiz.questions.length > 0) {
            quizzes.push(mediumQuiz)
          }
        }

        // Add difficult quiz if exists
        if (dateData.difficult.length > 0) {
          const difficultQuiz = transformQuizRowToAPIFormat(
            dateData.difficult[0],
            dateData.date,
            'hard'
          )
          if (difficultQuiz.questions.length > 0) {
            quizzes.push(difficultQuiz)
          }
        }
      })

      if (quizzes.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Valid Quizzes',
          description:
            'No valid quizzes found to upload. Please check your data.',
        })
        setIsSaving(false)
        return
      }

      // Prepare payload in the format expected by the API
      const payload = {
        quizzes,
      }

      // Make API call to bulk upload endpoint using localhost
      const response = await fetch(
        'http://localhost:1337/api/daily-quiz/bulk-upload',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error?.message ||
            errorData.message ||
            `HTTP error! status: ${response.status}`
        )
      }

      const responseData = await response.json()

      toast({
        title: 'Saved Successfully',
        description: `${quizzes.length} quiz(es) have been uploaded to the backend.`,
      })

      console.log('Saved to backend:', responseData)
    } catch (error: any) {
      console.error('Error saving to backend:', error)
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description:
          error.message || 'Failed to save quiz data to the backend.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Uploaded':
        return 'default'
      case 'Scheduled':
        return 'secondary'
      case 'Missing':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const totalWeeklyAttempts = mockWeeklyData.reduce(
    (sum, day) => sum + day.attempts,
    0
  )
  const totalMonthlyAttempts = mockMonthlyData.reduce(
    (sum, week) => sum + week.attempts,
    0
  )

  return (
    <div className='mx-auto max-w-7xl space-y-6 p-6'>
      {/* Header Section */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Daily Quiz Management
        </h1>
        <p className='text-muted-foreground'>
          Manage daily quiz uploads and view quiz performance analytics.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Calendar Section */}
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle>Quiz Calendar</CardTitle>
            <CardDescription>
              Select a date (From Date) to view or upload quizzes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={handleDateSelect}
              className='rounded-md border'
              modifiers={{
                hasQuizzes: (date) => hasQuizzes(date),
              }}
              modifiersClassNames={{
                hasQuizzes: 'bg-accent/50',
              }}
              classNames={{
                cell: 'h-14',
                day: 'h-full w-full',
              }}
              components={{
                Day: ({ date }) => {
                  const status = getQuizStatus(date)
                  const dateKey = format(date, 'yyyy-MM-dd')
                  const isQuizDate = dateKey in mockQuizDates
                  const isSelected =
                    selectedDate &&
                    format(date, 'yyyy-MM-dd') ===
                      format(selectedDate, 'yyyy-MM-dd')
                  const isToday =
                    format(date, 'yyyy-MM-dd') ===
                    format(new Date(), 'yyyy-MM-dd')

                  return (
                    <div className='flex h-full w-full flex-col items-center justify-center gap-1 p-1'>
                      <button
                        type='button'
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-md text-sm font-normal transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                            : isToday
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent hover:text-accent-foreground',
                          'focus:bg-accent focus:text-accent-foreground'
                        )}
                        onClick={() => handleDateSelect(date)}
                      >
                        {format(date, 'd')}
                      </button>
                      {isQuizDate && status && (
                        <div className='flex gap-0.5'>
                          {status.easy && (
                            <Badge
                              variant='outline'
                              className='h-4 border-green-500 bg-green-500/20 px-1 text-[9px] font-semibold text-green-700 dark:text-green-400'
                              title='Easy Quiz Available'
                            >
                              E
                            </Badge>
                          )}
                          {status.medium && (
                            <Badge
                              variant='outline'
                              className='h-4 border-blue-500 bg-blue-500/20 px-1 text-[9px] font-semibold text-blue-700 dark:text-blue-400'
                              title='Medium Quiz Available'
                            >
                              M
                            </Badge>
                          )}
                          {status.hard && (
                            <Badge
                              variant='outline'
                              className='h-4 border-red-500 bg-red-500/20 px-1 text-[9px] font-semibold text-red-700 dark:text-red-400'
                              title='Hard Quiz Available'
                            >
                              H
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )
                },
              }}
            />
            {/* Legend */}
            <div className='mt-4 flex flex-wrap items-center gap-3 text-xs'>
              <span className='font-medium text-muted-foreground'>Legend:</span>
              <div className='flex items-center gap-1.5'>
                <Badge
                  variant='outline'
                  className='h-4 border-green-500 bg-green-500/20 px-1 text-[9px] font-semibold text-green-700 dark:text-green-400'
                >
                  E
                </Badge>
                <span className='text-muted-foreground'>Easy</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <Badge
                  variant='outline'
                  className='h-4 border-blue-500 bg-blue-500/20 px-1 text-[9px] font-semibold text-blue-700 dark:text-blue-400'
                >
                  M
                </Badge>
                <span className='text-muted-foreground'>Medium</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <Badge
                  variant='outline'
                  className='h-4 border-red-500 bg-red-500/20 px-1 text-[9px] font-semibold text-red-700 dark:text-red-400'
                >
                  H
                </Badge>
                <span className='text-muted-foreground'>Hard</span>
              </div>
            </div>
            {selectedDate && (
              <div className='mt-4 space-y-2'>
                <div className='rounded-lg bg-muted p-3'>
                  <p className='mb-2 text-sm font-medium'>
                    Selected: {format(selectedDate, 'MMMM d, yyyy')}
                  </p>
                  {(() => {
                    const status = getQuizStatus(selectedDate)
                    if (!status) {
                      return (
                        <p className='text-sm text-muted-foreground'>
                          No quizzes uploaded for this date.
                        </p>
                      )
                    }
                    return (
                      <div className='space-y-1 text-sm'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>Easy:</span>
                          {status.easy ? (
                            <CheckCircle2 className='h-4 w-4 text-green-500' />
                          ) : (
                            <XCircle className='h-4 w-4 text-muted-foreground' />
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>Medium:</span>
                          {status.medium ? (
                            <CheckCircle2 className='h-4 w-4 text-green-500' />
                          ) : (
                            <XCircle className='h-4 w-4 text-muted-foreground' />
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>Hard:</span>
                          {status.hard ? (
                            <CheckCircle2 className='h-4 w-4 text-green-500' />
                          ) : (
                            <XCircle className='h-4 w-4 text-muted-foreground' />
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process Quiz CSV Section */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Process Quiz CSV</CardTitle>
            <CardDescription>
              Upload CSV file and select date range for quiz upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {/* Date Range Display */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>From Date</label>
                  <div className='rounded-md border p-3'>
                    {selectedDate ? (
                      <p className='text-sm font-medium'>
                        {format(selectedDate, 'MMMM d, yyyy')}
                      </p>
                    ) : (
                      <p className='text-sm text-muted-foreground'>
                        Select date from calendar
                      </p>
                    )}
                  </div>
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>To Date</label>
                  <div className='rounded-md border p-3'>
                    {toDate ? (
                      <div className='space-y-1'>
                        <p className='text-sm font-medium'>
                          {format(toDate, 'MMMM d, yyyy')}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          (Auto-calculated based on row count)
                        </p>
                      </div>
                    ) : (
                      <p className='text-sm text-muted-foreground'>
                        Will be calculated after CSV upload
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Row Count Display */}
              {rowCount > 0 && (
                <div className='rounded-lg border bg-muted/50 p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium'>
                        Upload Quiz Row Count
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Based on selected date:{' '}
                        {selectedDate
                          ? format(selectedDate, 'MMMM d, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-2xl font-bold text-primary'>
                        {rowCount}
                      </p>
                      <p className='text-xs text-muted-foreground'>rows</p>
                    </div>
                  </div>
                  {selectedDate && toDate && (
                    <div className='mt-3 flex items-center gap-2 text-xs text-muted-foreground'>
                      <span>Date Range:</span>
                      <Badge variant='outline'>
                        {format(selectedDate, 'MMM d')} -{' '}
                        {format(toDate, 'MMM d, yyyy')}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* File Upload */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>
                  Quiz CSV File (supports Easy, Medium, and Hard)
                </label>
                <Input
                  type='file'
                  accept='.csv'
                  onChange={handleFileSelect}
                  className='cursor-pointer'
                  disabled={!selectedDate || isProcessing}
                />
                {csvFile && (
                  <div className='flex items-center gap-2 rounded-md border bg-muted/50 p-3 text-sm'>
                    <FileSpreadsheet className='h-4 w-4 text-muted-foreground' />
                    <span className='flex-1 truncate font-medium'>
                      {csvFile.name}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {(csvFile.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                )}
                {isProcessing && (
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                    <span>Processing CSV and converting to JSON...</span>
                  </div>
                )}
              </div>

              {/* JSON Preview - Date Wise */}
              {jsonData &&
                jsonData.dateWise &&
                jsonData.dateWise.length > 0 && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <label className='flex items-center gap-2 text-sm font-medium'>
                        <FileJson className='h-4 w-4' />
                        Converted JSON Data (Date Wise)
                      </label>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            const jsonString = JSON.stringify(
                              jsonData.dateWise,
                              null,
                              2
                            )
                            navigator.clipboard.writeText(jsonString)
                            toast({
                              title: 'Copied to Clipboard',
                              description:
                                'All JSON data has been copied to your clipboard.',
                            })
                          }}
                        >
                          Copy All JSON
                        </Button>
                        <Button
                          variant='default'
                          size='sm'
                          onClick={saveToBackend}
                          disabled={
                            isSaving ||
                            !jsonData?.dateWise ||
                            jsonData.dateWise.length === 0
                          }
                          className='gap-2'
                        >
                          {isSaving ? (
                            <>
                              <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className='h-4 w-4' />
                              Save to Backend
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className='max-h-[600px] space-y-4 overflow-y-auto'>
                      {jsonData.dateWise.map((dateData, index) => {
                        console.log('Rendering dateData:', dateData)
                        return (
                          <Card key={dateData.date} className='border-2'>
                            <CardHeader className='pb-3'>
                              <div className='flex items-center justify-between'>
                                <CardTitle className='text-base'>
                                  {format(
                                    new Date(dateData.date),
                                    'MMMM d, yyyy'
                                  )}
                                </CardTitle>
                                <Badge variant='outline' className='text-xs'>
                                  Day {index + 1}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className='space-y-3'>
                              {/* Easy Quiz */}
                              <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center gap-2'>
                                    <Badge
                                      variant='outline'
                                      className='h-5 border-green-500 bg-green-500/20 px-2 text-xs font-semibold text-green-700 dark:text-green-400'
                                    >
                                      E
                                    </Badge>
                                    <label className='text-sm font-medium'>
                                      Easy Quiz ({dateData.easy.length} item
                                      {dateData.easy.length !== 1 ? 's' : ''})
                                    </label>
                                  </div>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => {
                                      const jsonString = JSON.stringify(
                                        dateData.easy,
                                        null,
                                        2
                                      )
                                      navigator.clipboard.writeText(jsonString)
                                      toast({
                                        title: 'Copied to Clipboard',
                                        description: `Easy quiz data for ${format(new Date(dateData.date), 'MMM d, yyyy')} copied.`,
                                      })
                                    }}
                                  >
                                    Copy
                                  </Button>
                                </div>
                                <div className='max-h-40 overflow-auto rounded-md border border-green-500/20 bg-muted/30 p-3'>
                                  <pre className='text-xs'>
                                    <code>
                                      {JSON.stringify(dateData.easy, null, 2)}
                                    </code>
                                  </pre>
                                </div>
                              </div>

                              {/* Medium Quiz */}
                              <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center gap-2'>
                                    <Badge
                                      variant='outline'
                                      className='h-5 border-blue-500 bg-blue-500/20 px-2 text-xs font-semibold text-blue-700 dark:text-blue-400'
                                    >
                                      M
                                    </Badge>
                                    <label className='text-sm font-medium'>
                                      Medium Quiz ({dateData.medium.length} item
                                      {dateData.medium.length !== 1 ? 's' : ''})
                                    </label>
                                  </div>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => {
                                      const jsonString = JSON.stringify(
                                        dateData.medium,
                                        null,
                                        2
                                      )
                                      navigator.clipboard.writeText(jsonString)
                                      toast({
                                        title: 'Copied to Clipboard',
                                        description: `Medium quiz data for ${format(new Date(dateData.date), 'MMM d, yyyy')} copied.`,
                                      })
                                    }}
                                  >
                                    Copy
                                  </Button>
                                </div>
                                <div className='max-h-40 overflow-auto rounded-md border border-blue-500/20 bg-muted/30 p-3'>
                                  <pre className='text-xs'>
                                    <code>
                                      {JSON.stringify(dateData.medium, null, 2)}
                                    </code>
                                  </pre>
                                </div>
                              </div>

                              {/* Difficult Quiz */}
                              <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center gap-2'>
                                    <Badge
                                      variant='outline'
                                      className='h-5 border-red-500 bg-red-500/20 px-2 text-xs font-semibold text-red-700 dark:text-red-400'
                                    >
                                      D
                                    </Badge>
                                    <label className='text-sm font-medium'>
                                      Difficult Quiz (
                                      {dateData.difficult.length} item
                                      {dateData.difficult.length !== 1
                                        ? 's'
                                        : ''}
                                      )
                                    </label>
                                  </div>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => {
                                      const jsonString = JSON.stringify(
                                        dateData.difficult,
                                        null,
                                        2
                                      )
                                      navigator.clipboard.writeText(jsonString)
                                      toast({
                                        title: 'Copied to Clipboard',
                                        description: `Difficult quiz data for ${format(new Date(dateData.date), 'MMM d, yyyy')} copied.`,
                                      })
                                    }}
                                  >
                                    Copy
                                  </Button>
                                </div>
                                <div className='max-h-40 overflow-auto rounded-md border border-red-500/20 bg-muted/30 p-3'>
                                  <pre className='text-xs'>
                                    <code>
                                      {JSON.stringify(
                                        dateData.difficult,
                                        null,
                                        2
                                      )}
                                    </code>
                                  </pre>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}
              {jsonData &&
                jsonData.dateWise &&
                jsonData.dateWise.length === 0 && (
                  <div className='rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground'>
                    No data to display. Please upload a CSV file with quiz data.
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Quizzes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Quizzes</CardTitle>
          <CardDescription>View and manage scheduled quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Easy</TableHead>
                <TableHead>Medium</TableHead>
                <TableHead>Hard</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUpcomingQuizzes.map((quiz) => (
                <TableRow key={quiz.date}>
                  <TableCell className='font-medium'>
                    {format(new Date(quiz.date), 'MMMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {quiz.easy ? (
                      <CheckCircle2 className='h-5 w-5 text-green-500' />
                    ) : (
                      <XCircle className='h-5 w-5 text-muted-foreground' />
                    )}
                  </TableCell>
                  <TableCell>
                    {quiz.medium ? (
                      <CheckCircle2 className='h-5 w-5 text-green-500' />
                    ) : (
                      <XCircle className='h-5 w-5 text-muted-foreground' />
                    )}
                  </TableCell>
                  <TableCell>
                    {quiz.hard ? (
                      <CheckCircle2 className='h-5 w-5 text-green-500' />
                    ) : (
                      <XCircle className='h-5 w-5 text-muted-foreground' />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(quiz.status)}>
                      {quiz.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quiz Attempts Analytics Section */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* This Week's Attempts */}
        <Card>
          <CardHeader>
            <CardTitle>This Week&apos;s Attempts</CardTitle>
            <CardDescription>
              Total: {totalWeeklyAttempts.toLocaleString()} attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={mockWeeklyData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='day' />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey='attempts' fill='hsl(var(--primary))' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* This Month's Attempts */}
        <Card>
          <CardHeader>
            <CardTitle>This Month&apos;s Attempts</CardTitle>
            <CardDescription>
              Total: {totalMonthlyAttempts.toLocaleString()} attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={mockMonthlyData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='week' />
                <YAxis />
                <RechartsTooltip />
                <Line
                  type='monotone'
                  dataKey='attempts'
                  stroke='hsl(var(--primary))'
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

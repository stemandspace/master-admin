import { toast } from '@/hooks/use-toast'
import strapi from './strapi'
import { clg } from '@/lib/utils'

const getDjQuestions = async () => {
  try {
    const response = await strapi.get(
      '/discovery-jar-questions?filters[answer]&populate=*'
    )
    // query validation = answer should be null & user should not be null
    return response.data.data
  } catch (error) {
    console.log(error)
  }
}

const getDjAnswers = async () => {
  try {
    const response = await strapi.get('/discovery-jar-answers')
    // fetch list of answers published;

    return response.data.data
  } catch (error) {
    console.log(error)
  }
}

const ConnectDjQuestionsWithAnswer = async (
  qIds: string[], // questions ids goes here...
  aIds: string // answer id goes here...
) => {
  try {
    await strapi.put(`/discovery-jar-answers/${aIds}`, {
      discovery_jar_questions: qIds,
    })
    clg('All questions updated successfully!')
    toast({
      title: 'All questions connected successfully!',
    })
  } catch (error) {
    console.log(error)
  }
}

export { getDjQuestions, getDjAnswers, ConnectDjQuestionsWithAnswer }

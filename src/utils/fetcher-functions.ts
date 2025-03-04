import { clg } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import strapi from './strapi'

const getThemes = async () => {
  try {
    const response = await strapi.get('/disconvery-jar-configs?populate=*')
    return response.data.data
  } catch (error) {
    console.log(error)
  }
}

const getDjQuestions = async ({ id }: { id: string }) => {
  try {
    const response = await strapi.get(
      `/discovery-jar-questions?filters[$and][0][theme][id][$eq]=${id}&filters[$and][1][answer][id][$null]=true`
    );
    clg(response)
    return response.data.data
  } catch (error) {
    console.log(error)
  }
}

const getDjAnswers = async () => {
  try {
    const response = await strapi.get('/discovery-jar-answers')

    // '/discovery-jar-answers?filters[createdAt][$notNull]=true'
    // fetch list of answers published;

    return response.data.data
  } catch (error) {
    console.log(error)
  }
}
const getConfigRewards = async ({ id }: { id: string }) => {
  try {
    const response = await strapi.get(`/rewards?filters[discovery_jar_config][id][$eq]=${id}&populate=*`)
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
const getChallenges = async () => {
  try {
    const response = await strapi.get('/challenges?populate=*')
    return response.data.data
  } catch (error) {
    console.log(error)
  }
}

const getChallengeRequest = async ({ id }: { id: string }) => {
  console.log(id)

  try {
    const response = await strapi.get(
      `/challenge-requests?filters[challengeId][$eq]=${id}&populate=*`
    )
    return response.data.data
  } catch (error) {
    console.log(error)
  }
}

const challengeRequestUpdate = async ({
  id,
  status,
  winner,
}: {
  id: string
  status: string
  winner: boolean
}) => {
  try {
    const res = await strapi.put(`/challenge-requests/${id}`, {
      status: status,
      winner: winner,
    })
    clg(res)
  } catch (error) {
    console.error(error)
  }
}


const getCourses = async () => {
  try {
    const response = await strapi.get('/courses?populate=*')
    return response.data.data
  } catch (error) {
    console.log(error)
  }
}


const getActivityRequest = async ({ id }: { id: string }) => {
  try {
    const response = await strapi.get(`/activity-requests?filters[courseId][$eq]=${id}&populate=*`)
    return response.data.data
  } catch (error) {
    console.log(error)
  }
}

const activityUpdate = async ({
  id,
  status,
  winner,
}: {
  id: string
  status: string
  winner: boolean
}) => {
  try {
    const res = await strapi.put(`/activity-requests/${id}`, {
      status: status,
      winner: winner,
    })
    clg(res)
  } catch (error) {
    console.error(error)
  }
}

export {
  getThemes,
  getDjQuestions,
  getDjAnswers,
  getConfigRewards,
  ConnectDjQuestionsWithAnswer,
  getChallenges,
  getChallengeRequest,
  challengeRequestUpdate,
  getCourses,
  getActivityRequest,
  activityUpdate,
}

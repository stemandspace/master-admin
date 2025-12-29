import {
  APPROVED_TEMPLATE_ID,
  REJECT_TEMPLATE_ID,
  WINNER_TEMPLATE_ID,
} from '@/lib/templateIds'
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
    )
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
    const response = await strapi.get(
      `/rewards?filters[discovery_jar_config][id][$eq]=${id}&populate=*`
    )
    return response.data.data
  } catch (error) {
    console.log(error)
  }
}

const ConnectDjQuestionsWithAnswer = async ({
  qIds,
  aId,
  rewardIds,
}: {
  qIds: string[]
  aId: string
  rewardIds: []
}) => {
  try {
    await strapi.put(`/discovery-jar-answers/${aId}`, {
      discovery_jar_questions: qIds,
    })
    const usersRes = Promise.all(
      qIds.map(async (id) => {
        const q = await strapi.get(`/discovery-jar-questions/${id}/?populate=*`)
        return {
          userId: q.data?.data?.user?.id,
          name: `${q.data?.data?.user?.firstname} ${q.data?.data?.user?.lastname}`,
          email: q.data?.data?.user?.email,
        }
      })
    )
    const users = await usersRes
    await Promise.all(
      users.map(async (user) => {
        await strapi.post(`/v1/reward`, {
          userId: user.userId,
          rewardIds,
        })
        await strapi.post('/notificationxes', {
          mail_template: WINNER_TEMPLATE_ID,
          channel: 'mail',
          user: Number(user.userId),
          variables: {
            variables: {
              challenge_link: 'challenge_link_value',
              challenge_name: 'exp',
              name: name,
            },
            name: user.name,
            email: user.email,
          },
        })
      })
    )
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
  //winner,
  userId,
  email,
  name,
  challengeRewards,
}: {
  id: string
  status: string
  winner?: boolean
  userId: string
  email: string
  name: string
  challengeRewards: {
    rewards: []
    winner_reward: []
    title: string
  }
}) => {
  try {
    await strapi.put(`/challenge-requests/${id}`, {
      status: status === 'winner' ? 'approved' : status,
      winner: status === 'winner' ? true : false,
    })

    const challengeName = challengeRewards.title

    if (status === 'winner') {
      const allRewards = [
        ...challengeRewards.rewards,
        ...challengeRewards.winner_reward,
      ]
      const uniqueArr = allRewards.filter(
        (obj: any, index, self) =>
          index === self.findIndex((o: any) => o.id === obj.id)
      )
      const rewardIds = uniqueArr.map((r: any) => r.id)
      await strapi.post(`/v1/reward`, {
        userId,
        rewardIds,
      })
      await strapi.post('/notificationxes', {
        mail_template: WINNER_TEMPLATE_ID,
        channel: 'mail',
        user: Number(userId),
        variables: {
          variables: {
            challenge_link: 'challenge_link_value',
            challenge_name: challengeName,
            name: name,
          },
          name,
          email,
        },
      })
    }
    if (status === 'approved') {
      const rewardIds = challengeRewards.rewards.map((r: any) => r.id)
      await strapi.post(`/v1/reward`, {
        userId,
        rewardIds,
      })
      await strapi.post('/notificationxes', {
        mail_template: APPROVED_TEMPLATE_ID,
        channel: 'mail',
        user: Number(userId),
        variables: {
          variables: {
            challenge_link: 'challenge_link_value',
            challenge_name: challengeName,
            name,
            product_name: 'product_name_value',
          },
          name,
          email,
        },
      })
    }
    if (status === 'rejected') {
      await strapi.delete(`/challenge-requests/${id}`)
      await strapi.post('/notificationxes', {
        mail_template: REJECT_TEMPLATE_ID,
        channel: 'mail',
        user: Number(userId),
        variables: {
          variables: {
            challenge_link: 'challenge_link_value',
            challenge_name: challengeName,
            name,
            product_name: 'product_name_value',
          },
          name,
          email,
        },
      })
    }
  } catch (error) {
    console.error(error)
  }
}

const getChallengeRewards = async ({
  challengeId,
}: {
  challengeId: string
}) => {
  try {
    const response = await strapi.get(`/challenges/${challengeId}?populate=*`)
    const winner_reward = response.data.data.winner_reward || []
    const rewards = response.data.data.rewards || []
    const title = response.data.data.title
    return { winner_reward, rewards, title }
  } catch (error) {
    console.log('Challenges fetch Error', error)
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
    const response = await strapi.get(
      `/activity-requests?filters[courseId][$eq]=${id}&populate=*`
    )
    return response.data.data
  } catch (error) {
    console.log(error)
  }
}

const activityUpdate = async ({
  id,
  status,
  userId,
  name,
  email,
  activityRewards,
}: {
  id: string
  status: string
  userId: string
  email: string
  name: string
  activityRewards: {
    rewards: []
    title: string
  }
}) => {
  try {
    await strapi.put(`/activity-requests/${id}`, {
      status: status === 'winner' ? 'approved' : status,
      winner: status === 'winner' ? true : false,
    })

    const rewardIds = activityRewards.rewards.map((r: any) => r.id)
    const challengeName = activityRewards.title

    if (status === 'approved') {
      await strapi.post(`/v1/reward`, {
        userId,
        rewardIds,
      })
      await strapi.post('/notificationxes', {
        mail_template: APPROVED_TEMPLATE_ID,
        channel: 'mail',
        user: Number(userId),
        variables: {
          variables: {
            challenge_link: 'challenge_link_value',
            challenge_name: challengeName,
            name,
            product_name: 'product_name_value',
          },
          name,
          email,
        },
      })
    }
    if (status === 'rejected') {
      await strapi.delete(`/activity-requests/${id}`)
      await strapi.post('/notificationxes', {
        mail_template: REJECT_TEMPLATE_ID,
        channel: 'mail',
        user: Number(userId),
        variables: {
          variables: {
            challenge_link: 'challenge_link_value',
            challenge_name: challengeName,
            name,
            product_name: 'product_name_value',
          },
          name,
          email,
        },
      })
    }
  } catch (error) {
    console.error(error)
  }
}

const getActivityRewards = async ({ courseId }: { courseId: string }) => {
  try {
    const response = await strapi.get(
      `/courses/${courseId}?populate[activity_modules][populate][rewards]=*`
    )

    const rewards = response.data.data.activity_modules.rewards || []
    const title = response.data.data.activity_modules.name || ''
    return { rewards, title }
  } catch (error) {
    console.log('Activity Reward  fetch Error', error)
  }
}

// Submissions CRUD functions
const getSubmissions = async ({
  content_type,
  content_id,
}: {
  content_type?: string
  content_id?: string
}) => {
  try {
    let url = '/submissions?populate=*'
    const filters: string[] = []

    if (content_type) {
      filters.push(`filters[content_type][$eq]=${content_type}`)
    }
    if (content_id) {
      filters.push(`filters[content_id][$eq]=${content_id}`)
    }

    if (filters.length > 0) {
      url += `&${filters.join('&')}`
    }

    const response = await strapi.get(url)
    return response.data.data
  } catch (error) {
    console.log('Submissions fetch Error', error)
    throw error
  }
}

const getSubmission = async ({ id }: { id: string }) => {
  try {
    const response = await strapi.get(`/submissions/${id}?populate=*`)
    return response.data.data
  } catch (error) {
    console.log('Submission fetch Error', error)
    throw error
  }
}

const updateSubmissionStatus = async ({
  id,
  status,
  submissionData,
}: {
  id: string
  status: 'pending' | 'selected' | 'rejected'
  submissionData?: {
    content_type?: string
    content_id?: string
    user?: {
      id: string
      email: string
      firstname?: string
      lastname?: string
      username?: string
    }
  }
}) => {
  try {
    const response = await strapi.put(`/submissions/${id}`, {
      status,
    })

    // Process rewards if status is 'selected' and content_type is 'diy'
    if (status === 'selected' && submissionData?.content_type === 'diy' && submissionData?.content_id) {
      try {
        // Find live event by content_id (live event's live.id should match content_id)
        const liveEventsResponse = await strapi.get(
          `/live-events?filters[live][id][$eq]=${submissionData.content_id}&populate[live]=*&populate[submission_rewards]=*`
        )
        
        const liveEvents = liveEventsResponse.data.data
        if (liveEvents && liveEvents.length > 0) {
          const liveEvent = liveEvents[0]
          
          // Get submission_rewards from live event
          if (liveEvent.submission_rewards && liveEvent.submission_rewards.length > 0) {
            const rewardIds = liveEvent.submission_rewards.map((r: any) => r.id || r)
            
            if (rewardIds.length > 0 && submissionData.user?.id) {
              // Process the reward
              await strapi.post(`/v1/reward`, {
                userId: Number(submissionData.user.id),
                rewardIds,
              })

              // Send notification
              const userName = submissionData.user.firstname && submissionData.user.lastname
                ? `${submissionData.user.firstname} ${submissionData.user.lastname}`
                : submissionData.user.username || 'User'

              await strapi.post('/notificationxes', {
                mail_template: APPROVED_TEMPLATE_ID,
                channel: 'mail',
                user: Number(submissionData.user.id),
                variables: {
                  variables: {
                    challenge_link: 'challenge_link_value',
                    challenge_name: liveEvent.title || 'Live Event',
                    name: userName,
                    product_name: 'product_name_value',
                  },
                  name: userName,
                  email: submissionData.user.email,
                },
              })
            }
          }
        }
      } catch (rewardError) {
        console.log('Reward processing error:', rewardError)
        // Don't fail the whole operation if reward processing fails
      }
    }

    toast({
      title: 'Success',
      description: `Submission ${status === 'selected' ? 'confirmed' : status} successfully`,
    })
    return response.data.data
  } catch (error) {
    console.log('Submission update Error', error)
    toast({
      title: 'Error',
      description: 'Failed to update submission',
      variant: 'destructive',
    })
    throw error
  }
}

// Live Events CRUD functions
const getLiveEvents = async () => {
  try {
    const response = await strapi.get('/live-events?populate=*')
    return response.data.data
  } catch (error) {
    console.log('Live Events fetch Error', error)
    throw error
  }
}

const getLiveEvent = async ({ id }: { id: string }) => {
  try {
    const response = await strapi.get(`/live-events/${id}?populate=*`)
    return response.data.data
  } catch (error) {
    console.log('Live Event fetch Error', error)
    throw error
  }
}

const createLiveEvent = async (data: {
  title: string
  winners_rewards?: number[]
  participation_rewards?: number[]
  winners?: number[]
  participants?: number[]
  winners_rewarded?: boolean
  participations_rewarded?: boolean
  live?: number
}) => {
  try {
    const response = await strapi.post('/live-events', { data })
    toast({
      title: 'Success',
      description: 'Live event created successfully',
    })
    return response.data.data
  } catch (error) {
    console.log('Live Event create Error', error)
    toast({
      title: 'Error',
      description: 'Failed to create live event',
      variant: 'destructive',
    })
    throw error
  }
}

const updateLiveEvent = async ({
  id,
  data,
}: {
  id: string
  data: {
    title?: string
    winners_rewards?: number[]
    participation_rewards?: number[]
    winners?: number[]
    participants?: number[]
    winners_rewarded?: boolean
    participations_rewarded?: boolean
    live?: number
  }
}) => {
  try {
    const response = await strapi.put(`/live-events/${id}`, { data })
    toast({
      title: 'Success',
      description: 'Live event updated successfully',
    })
    return response.data.data
  } catch (error) {
    console.log('Live Event update Error', error)
    toast({
      title: 'Error',
      description: 'Failed to update live event',
      variant: 'destructive',
    })
    throw error
  }
}

const deleteLiveEvent = async ({ id }: { id: string }) => {
  try {
    await strapi.delete(`/live-events/${id}`)
    toast({
      title: 'Success',
      description: 'Live event deleted successfully',
    })
  } catch (error) {
    console.log('Live Event delete Error', error)
    toast({
      title: 'Error',
      description: 'Failed to delete live event',
      variant: 'destructive',
    })
    throw error
  }
}

const getLives = async () => {
  try {
    const response = await strapi.get('/lives?populate=*')
    return response.data.data
  } catch (error) {
    console.log('Lives fetch Error', error)
    throw error
  }
}

const getRewards = async () => {
  try {
    const response = await strapi.get('/rewards?populate=*')
    return response.data.data
  } catch (error) {
    console.log('Rewards fetch Error', error)
    throw error
  }
}

const getRewardById = async ({ id }: { id: string }) => {
  try {
    const response = await strapi.get(`/rewards/${id}?populate=*`)
    return response.data.data
  } catch (error) {
    console.log('Reward fetch Error', error)
    throw error
  }
}

const getUsers = async () => {
  try {
    const response = await strapi.get('/users?populate=*')
    return response.data.data
  } catch (error) {
    console.log('Users fetch Error', error)
    throw error
  }
}


const getLiveParticipants = async ({ liveId }: { liveId: string }) => {
  try {
    const response = await strapi.get(
      `/purchases?filters[content_id][$eq]=${liveId}&filters[type][$eq]=live&populate=*`
    )
    return response.data.data
  } catch (error) {
    console.log('Live participants fetch Error', error)
    throw error
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
  getChallengeRewards,
  getActivityRewards,
  getSubmissions,
  getSubmission,
  updateSubmissionStatus,
  getLiveEvents,
  getLiveEvent,
  createLiveEvent,
  updateLiveEvent,
  deleteLiveEvent,
  getLives,
  getRewards,
  getRewardById,
  getUsers,
  getLiveParticipants,
}

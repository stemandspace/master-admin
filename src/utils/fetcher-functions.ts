import { APPROVED_TEMPLATE_ID, WINNER_TEMPLATE_ID } from '@/lib/templateIds'
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
}: {
  id: string
  status: string
  winner?: boolean
  userId: string
  email: string
  name: string
}) => {
  try {
    const res = await strapi.put(`/challenge-requests/${id}`, {
      status: status === 'winner' ? 'approved' : status,
      winner: status === 'winner' ? true : false,
    })
    const challengeId = res.data.data.challengeId
    const getRewards = (await getChallengeRewards({ challengeId })) || {
      rewards: [],
      winner_reward: [],
      title: '',
    }
    const challengeName = getRewards.title

    if (status === 'winner') {
      const allRewards = [...getRewards.rewards, ...getRewards.winner_reward]
      const uniqueArr = allRewards.filter(
        (obj, index, self) => index === self.findIndex((o) => o.id === obj.id)
      )
      const rewardIds = uniqueArr.map((r) => r.id)
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
      const rewardIds = getRewards.rewards.map((r: any) => r.id)
      const rewardRes = await strapi.post(`/v1/reward`, {
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
      console.log(rewardRes, 'rewards')
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
}: {
  id: string
  status: string
  userId: string
  email: string
  name: string
}) => {
  try {
    const res = await strapi.put(`/activity-requests/${id}`, {
      status: status === 'winner' ? 'approved' : status,
      winner: status === 'winner' ? true : false,
    })

    const getRewards = (await getActivityRewards({
      courseId: res.data.data.courseId,
    })) || {
      rewards: [],
      title: '',
    }
    const rewardIds = getRewards.rewards.map((r: any) => r.id)
    const challengeName = getRewards.title

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
}

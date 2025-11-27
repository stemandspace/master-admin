import axios from 'axios'
import config from '@/config/microservices'

interface EmailAddress {
    address: string
    name: string
}

interface Recipient {
    email_address: EmailAddress
    merge_info?: Record<string, any>
}

interface SendBatchEmailParams {
    mailTemplateKey: string
    recipients: Recipient[]
}

/**
 * Send batch emails via ZeptoMail API
 */
export const sendZeptoMailBatch = async ({
    mailTemplateKey,
    recipients,
}: SendBatchEmailParams) => {
    if (!config.zeptomail.apiKey || config.zeptomail.apiKey.trim() === '') {
        const errorMsg = 'ZeptoMail API key is not configured. Please set VITE_ZEPTOMAIL_API_KEY environment variable.'
        console.error(errorMsg)
        throw new Error(errorMsg)
    }

    if (recipients.length === 0) {
        throw new Error('No recipients provided')
    }

    console.log('ZeptoMail request:', {
        baseURL: config.zeptomail.baseURL,
        mailTemplateKey,
        recipientsCount: recipients.length,
        from: config.zeptomail.from,
    })

    try {
        const response = await axios.post(
            `${config.zeptomail.baseURL}/email/template/batch`,
            {
                mail_template_key: mailTemplateKey,
                from: {
                    address: config.zeptomail.from.address,
                    name: config.zeptomail.from.name,
                },
                to: recipients,
            },
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Zoho-enczapikey ${config.zeptomail.apiKey}`,
                },
            }
        )

        console.log('ZeptoMail API response:', response.data)
        return response.data
    } catch (error) {
        console.error('ZeptoMail API error:', error)
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message
            const errorDetails = {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: errorMessage,
            }
            console.error('ZeptoMail error details:', errorDetails)
            throw new Error(`ZeptoMail API error: ${errorMessage}`)
        }
        throw error
    }
}

/**
 * Send batch emails to winners after rewards are sent
 */
export const sendWinnerEmails = async (
    users: Array<{ id: string; email: string; name: string }>
) => {
    if (users.length === 0) {
        console.warn('sendWinnerEmails called with empty users array')
        return
    }

    console.log('Preparing to send winner emails to:', users.length, 'users')

    const recipients = users.map((user) => ({
        email_address: {
            address: user.email,
            name: user.name || 'User',
        },
        merge_info: {},
    }))

    const mailTemplateKey =
        import.meta.env.VITE_ZEPTOMAIL_WINNER_TEMPLATE_KEY ||
        '2518b.5ca07f11c3f3c129.k1.9c873450-cb3f-11f0-8577-cabf48e1bf81.19ac350ec15'

    console.log('Using ZeptoMail template key:', mailTemplateKey)

    return await sendZeptoMailBatch({
        mailTemplateKey,
        recipients,
    })
}

/**
 * Send single email via ZeptoMail API (for participants)
 */
const sendZeptoMailSingle = async ({
    mailTemplateKey,
    recipient,
    mergeInfo = {},
}: {
    mailTemplateKey: string
    recipient: { email: string; name: string }
    mergeInfo?: Record<string, any>
}) => {
    if (!config.zeptomail.apiKey || config.zeptomail.apiKey.trim() === '') {
        const errorMsg = 'ZeptoMail API key is not configured. Please set VITE_ZEPTOMAIL_API_KEY environment variable.'
        console.error(errorMsg)
        throw new Error(errorMsg)
    }

    console.log('ZeptoMail single email request:', {
        baseURL: config.zeptomail.baseURL,
        mailTemplateKey,
        recipient,
        from: config.zeptomail.from,
    })

    try {
        const response = await axios.post(
            `${config.zeptomail.baseURL}/email/template`,
            {
                mail_template_key: mailTemplateKey,
                from: {
                    address: config.zeptomail.from.address,
                    name: config.zeptomail.from.name,
                },
                to: [
                    {
                        email_address: {
                            address: recipient.email,
                            name: recipient.name || 'User',
                        },
                    },
                ],
                merge_info: mergeInfo,
            },
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Zoho-enczapikey ${config.zeptomail.apiKey}`,
                },
            }
        )

        console.log('ZeptoMail API response:', response.data)
        return response.data
    } catch (error) {
        console.error('ZeptoMail API error:', error)
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message
            const errorDetails = {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: errorMessage,
            }
            console.error('ZeptoMail error details:', errorDetails)
            throw new Error(`ZeptoMail API error: ${errorMessage}`)
        }
        throw error
    }
}

/**
 * Send emails to participants after rewards are sent
 * Uses individual email endpoint for each participant
 */
export const sendParticipantEmails = async (
    users: Array<{ id: string; email: string; name: string }>
) => {
    if (users.length === 0) {
        console.warn('sendParticipantEmails called with empty users array')
        return
    }

    console.log('Preparing to send participant emails to:', users.length, 'users')

    const mailTemplateKey =
        import.meta.env.VITE_ZEPTOMAIL_PARTICIPANT_TEMPLATE_KEY ||
        '2518b.5ca07f11c3f3c129.k1.83301530-cb3f-11f0-8577-cabf48e1bf81.19ac3504603'

    console.log('Using ZeptoMail participant template key:', mailTemplateKey)

    // Send individual emails to each participant using Promise.all
    await Promise.all(
        users.map(async (user) => {
            return await sendZeptoMailSingle({
                mailTemplateKey,
                recipient: {
                    email: user.email,
                    name: user.name || 'User',
                },
                mergeInfo: {},
            })
        })
    )
}


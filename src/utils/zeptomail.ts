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
 * Send batch emails via server endpoint (which forwards to ZeptoMail)
 */
export const sendZeptoMailBatch = async ({
    mailTemplateKey,
    recipients,
}: SendBatchEmailParams) => {
    if (!config.zeptomail.serverURL || config.zeptomail.serverURL.trim() === '') {
        const errorMsg = 'Email server URL is not configured. Please set VITE_EMAIL_SERVER_URL environment variable.'
        console.error(errorMsg)
        throw new Error(errorMsg)
    }

    if (recipients.length === 0) {
        throw new Error('No recipients provided')
    }

    console.log('Sending ZeptoMail batch request via server:', {
        serverURL: config.zeptomail.serverURL,
        mailTemplateKey,
        recipientsCount: recipients.length,
        from: config.zeptomail.from,
    })

    try {
        const endpoint = config.zeptomail.serverURL
            ? `${config.zeptomail.serverURL}/api/email/send-zepto`
            : '/api/email/send-zepto'

        const response = await axios.post(
            endpoint,
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
                },
            }
        )

        console.log('Email server response:', response.data)
        return response.data
    } catch (error) {
        console.error('Email server error:', error)
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message
            const errorDetails = {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: errorMessage,
            }
            console.error('Email server error details:', errorDetails)
            throw new Error(`Email server error: ${errorMessage}`)
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
 * Send single email via server endpoint (which forwards to ZeptoMail)
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
    if (!config.zeptomail.serverURL || config.zeptomail.serverURL.trim() === '') {
        const errorMsg = 'Email server URL is not configured. Please set VITE_EMAIL_SERVER_URL environment variable.'
        console.error(errorMsg)
        throw new Error(errorMsg)
    }

    console.log('Sending ZeptoMail single email request via server:', {
        serverURL: config.zeptomail.serverURL,
        mailTemplateKey,
        recipient,
        from: config.zeptomail.from,
    })

    try {
        const endpoint = config.zeptomail.serverURL
            ? `${config.zeptomail.serverURL}/api/email/send-zepto`
            : '/api/email/send-zepto'

        const response = await axios.post(
            endpoint,
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
                },
            }
        )

        console.log('Email server response:', response.data)
        return response.data
    } catch (error) {
        console.error('Email server error:', error)
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message
            const errorDetails = {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: errorMessage,
            }
            console.error('Email server error details:', errorDetails)
            throw new Error(`Email server error: ${errorMessage}`)
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



conn.sendMessage(m.chat, {
    caption: headers,
    footer: info.wm,
    viewOnce: true,
    headerType: 5,
    contextInfo: {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363298688453806@newsletter',
            newsletterName: 🔮 ${staff.namebot} | Powered By ${staff.nameown},
            serverMessageId: -1
        },
        businessMessageForwardInfo: {
            businessOwnerJid: conn.decodeJid(conn.user.id)
        },
        externalAdReply: {
            title: 'Hai Kak ' + name,
            body: ucapan(),
            thumbnailUrl: pp,
            sourceUrl: 'https://tinyurl.com/2ygo84pu',
            mediaType: 1,
            renderLargerThumbnail: false
        }
    },
    buttons: [
        {
            buttonId: ".terima",
            buttonText: {
                displayText: "TERIMA"
            },
            type: 1
        },
        {
            buttonId: ".tolak",
            buttonText: {
                displayText: "TOLAK"
            },
            type: 1
        },
        {
            buttonId: ".ping",
            buttonText: {
                displayText: ".ping"
            },
            type: 4,
            nativeFlowInfo: {
                name: "single_select",
                paramsJson: JSON.stringify(datas) // Pastikan ini berisi data yang valid
            }
        }
    ]
}, { quoted: m });
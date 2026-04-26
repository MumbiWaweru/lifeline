"""
Lifeline AI Service - claude.py
Empathetic, situation-aware responses for GBV survivors.
Covers: physical harm, financial abuse, emotional abuse, sexual violence,
        online/digital abuse, child abuse, and compound situations.

Risk levels: low | medium | high | critical  (4-level, matches report spec)
"""

import os
from typing import Optional

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

# ─────────────────────────────────────────────
#  ONLINE MODE  –  Claude API system prompt
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """
You are a compassionate, trauma-informed support companion for Lifeline, a platform serving 
Gender-Based Violence (GBV) survivors in Kenya. You speak with warmth, without judgment, 
and always believe the person reaching out.

CORE PRINCIPLES
- Lead with empathy FIRST. Never jump straight to advice.
- Acknowledge the SPECIFIC harm they described — physical, financial, sexual, emotional, or digital.
- Never minimize. Never say "it could be worse" or "at least..."
- Never victim-blame. Never ask "why didn't you leave?" or "what did you do to provoke it?"
- Use plain, clear language. Avoid clinical or bureaucratic terms.
- If someone is in immediate danger, always surface emergency contacts early.
- Respect their autonomy. Offer options; don't prescribe.
- If they write in Swahili, respond in Swahili.

SITUATION RECOGNITION — tailor every response to the specific harm described:

PHYSICAL HARM (beating, kicking, strangling, weapon use, burns, injury)
- Acknowledge: the pain is real; what happened to their body was wrong.
- Ask gently about immediate safety and medical needs.
- Surface emergency numbers (999/112, Gender Violence Recovery Centre: 0800 720 990).
- Mention documentation of injuries can help if they choose to report.

FINANCIAL/ECONOMIC ABUSE (controlling money, taking income, sabotaging job, withholding basics)
- Name it clearly: "What you're describing is financial abuse — it's a real form of GBV."
- Acknowledge the specific trap: being dependent is not weakness, it was engineered.
- Offer practical angles: separate accounts, income support orgs, legal rights to marital property.
- Kenya resources: Kenya Legal Aid Centre (0800 723 253), FIDA Kenya (020 3875369).

SEXUAL VIOLENCE (rape, marital rape, forced acts, trafficking)
- Lead with belief and dignity: "I believe you. What happened was not your fault."
- Mention medical care options (PEP within 72hrs, forensic evidence window).
- Surface: Gender Violence Recovery Centre (0800 720 990), Nairobi Women's Hospital GBV line.
- Note: marital rape IS a crime in Kenya.

EMOTIONAL / PSYCHOLOGICAL ABUSE (threats, isolation, humiliation, gaslighting, controlling behaviour)
- Validate: "Abuse doesn't have to leave a bruise to be real. What you're going through counts."
- Help them name the pattern if they seem unsure it's abuse.
- Offer counselling referrals.

CHILD ABUSE / ABUSE OF A MINOR
- Express urgency gently but clearly.
- Report line: Childline Kenya 116 (free, 24/7).
- Assure them reporting is the right thing, not a betrayal.

DIGITAL / ONLINE ABUSE (non-consensual images, cyber harassment, surveillance, hacking)
- Acknowledge: online harm causes real harm.
- Guide on evidence preservation before deletion.
- Kenya: this falls under Computer Misuse and Cybercrimes Act 2018 — they have legal options.

COMPOUND SITUATIONS (multiple forms of abuse, or abuse + financial dependency)
- Don't rush to solve everything.
- Start with whichever harm feels most urgent to the person.
- Affirm that complexity is normal; support is still available.

RISK LEVEL GUIDANCE — you MUST include one of these tags at the very end of every response:
[RISK:critical] — weapon present, immediate threat to life, active assault happening now
[RISK:high]     — serious physical/sexual harm described, person unsafe right now
[RISK:medium]   — emotional/financial/digital abuse, safety concern but not immediate danger
[RISK:low]      — seeking information, unsure if it's abuse, general support

ALWAYS END WITH
- A reminder that they are not alone.
- At least one concrete next step they can choose to take.
- In HIGH-RISK or CRITICAL situations, include: Emergency: 999 or 112 | GBV Recovery: 0800 720 990 (free, 24/7)

WHAT TO NEVER DO
- Never end a response with only a list of numbers and no human words.
- Never start with "I understand how you feel" as an empty opener — be specific to what they said.
- Never rush a person out of the conversation toward resources without first sitting with them.
"""


# ─────────────────────────────────────────────
#  OFFLINE / STUB MODE  –  Rule-based responses
# ─────────────────────────────────────────────

# Each entry: (keyword_list, risk_level, english_response, swahili_response)
# risk_level is now one of: "low" | "medium" | "high" | "critical"
RESPONSE_RULES = [

    # ── CRITICAL: IMMEDIATE THREAT TO LIFE ───────────────────────────────────
    (
        ["kill me", "going to kill", "will kill", "ataniua", "ananiua",
         "knife to my", "gun", "weapon", "strangling", "choking",
         "i can't breathe", "he has a weapon", "threatening to kill"],
        "critical",
        (
            "What you're describing sounds extremely dangerous, and I want you to know — your life matters. "
            "Please, if you can do so safely, move away from that person right now.\n\n"
            "📞 Call 999 or 112 immediately.\n"
            "📞 Free GBV Recovery Line (24/7): 0800 720 990\n\n"
            "If you can't speak safely, you can text a trusted person your location. "
            "Your safety comes first — we can talk through everything else once you are somewhere safer. "
            "You are not alone in this."
        ),
        (
            "Unachokielezea kinasikika hatari sana, na nataka ujue — maisha yako yana thamani. "
            "Tafadhali, kama unaweza kufanya hivyo salama, toka mbali na mtu huyo sasa hivi.\n\n"
            "📞 Piga simu 999 au 112 mara moja.\n"
            "📞 Laini ya GBV Recovery bure (masaa 24/7): 0800 720 990\n\n"
            "Kama huwezi kuzungumza salama, unaweza kutumia ujumbe kwa mtu unayemwamini mahali ulipo. "
            "Usalama wako ndio unaokuja kwanza — tunaweza kuzungumza kuhusu kila kitu kingine ukiwa mahali salama. "
            "Huko peke yako katika hili."
        ),
    ),

    # ── SEXUAL VIOLENCE (also critical) ──────────────────────────────────────
    (
        ["raped", "rape", "sexual", "forced me", "touched me", "ubakaji",
         "alibaka", "anabaka", "forced sex", "marital rape", "ndoa ubakaji",
         "sexually assaulted", "assault"],
        "critical",
        (
            "I believe you. What happened to you was not your fault — not in any way, not at all.\n\n"
            "Sexual violence, including within marriage, is a crime in Kenya. You have done nothing wrong.\n\n"
            "If this happened recently (within 72 hours), there is medical care that can help — "
            "including treatment to prevent infections and, if needed, emergency contraception. "
            "This care is available at the Gender Violence Recovery Centre and Nairobi Women's Hospital.\n\n"
            "You don't have to report to the police right now if you're not ready. But if you want to, "
            "evidence matters, and a medical professional can help preserve it.\n\n"
            "📞 GBV Recovery Line (free, 24/7): 0800 720 990\n"
            "📞 Nairobi Women's Hospital GBV: 0719 638 006\n\n"
            "You are incredibly brave for reaching out. Whatever you need next, I'm here."
        ),
        (
            "Nakuamini. Kilichokupata haukustahili — kwa njia yoyote, hata kidogo.\n\n"
            "Jeuri ya kingono, ikiwemo ndani ya ndoa, ni uhalifu nchini Kenya. Hujafanya kosa lolote.\n\n"
            "Kama hii ilitokea hivi karibuni (ndani ya masaa 72), kuna matibabu yanayoweza kusaidia — "
            "ikiwemo matibabu kuzuia maambukizo na, ikihitajika, uzazi wa mpango wa dharura. "
            "Huduma hii inapatikana katika Kituo cha Urejeleaji wa Jeuri ya Kijinsia na Hospitali ya Wanawake ya Nairobi.\n\n"
            "Huhitaji kuripoti kwa polisi sasa hivi kama hujawa tayari. Lakini ukitaka, "
            "ushahidi una umuhimu, na mtaalamu wa matibabu anaweza kusaidia kuuhifadhi.\n\n"
            "📞 Laini ya GBV Recovery (bure, masaa 24/7): 0800 720 990\n"
            "📞 GBV ya Hospitali ya Wanawake ya Nairobi: 0719 638 006\n\n"
            "Unashujaa sana kwa kutafuta msaada. Chochote unachohitaji kinachofuata, niko hapa."
        ),
    ),

    # ── CHILD ABUSE (critical) ────────────────────────────────────────────────
    (
        ["child", "mtoto", "children", "watoto", "daughter", "binti", "son", "mwana",
         "minor", "kid", "baby", "mdogo", "abuse my child", "hurting my child",
         "anaumiza mtoto", "school", "shule"],
        "critical",
        (
            "Your concern for this child is so important, and reaching out was exactly the right thing to do.\n\n"
            "Children cannot protect themselves from adults who harm them — that's why people like you, "
            "who notice and speak up, matter so much.\n\n"
            "📞 Childline Kenya (free, 24/7): 116\n\n"
            "If the child is in immediate physical danger, call 999 or 112 now.\n\n"
            "You are not betraying anyone by protecting a child. "
            "You are doing exactly what a caring person does."
        ),
        (
            "Wasiwasi wako kwa mtoto huyu ni muhimu sana, na kutafuta msaada ilikuwa jambo sahihi kufanya.\n\n"
            "Watoto hawawezi kujilinda dhidi ya watu wazima wanaowaumiza — ndiyo maana watu kama wewe, "
            "wanaogundua na kusema, wana umuhimu mkubwa sana.\n\n"
            "📞 Childline Kenya (bure, masaa 24/7): 116\n\n"
            "Kama mtoto yuko katika hatari ya haraka ya kimwili, piga simu 999 au 112 sasa.\n\n"
            "Husaliti mtu yeyote kwa kulinda mtoto. "
            "Unafanya hasa kile ambacho mtu mwenye huruma hufanya."
        ),
    ),

    # ── PHYSICAL HARM (high) ──────────────────────────────────────────────────
    (
        ["hit", "beat", "slap", "punch", "kick", "pushed", "shoved", "burned", "burnt",
         "injured", "bruise", "broken bone", "hospital", "anipiga", "ananipiga", "alipiga",
         "physical", "hurt me", "hurting me", "he hurt", "she hurt"],
        "high",
        (
            "I'm so sorry this happened to you. What you experienced — being physically hurt by someone "
            "who should be safe — is never okay, and it is never your fault.\n\n"
            "Right now, the most important thing is your safety and your body. "
            "If you have injuries, please try to get medical attention — even if they seem minor, "
            "a doctor can treat you and also document what happened, which can matter later if you choose to report.\n\n"
            "If you're still in the same space as the person who hurt you and feel unsafe, "
            "you can call 999 or 112, or reach the free GBV support line: 0800 720 990 (24/7).\n\n"
            "You don't have to make any big decisions right now. But please know there are people "
            "ready to stand with you. Would you like help finding a shelter or a safe place nearby?"
        ),
        (
            "Pole sana kwa hili lililokupata. Ulichopitia — kuumizwa kimwili na mtu "
            "ambaye angepaswa kuwa salama — si sawa kamwe, na si kosa lako kamwe.\n\n"
            "Kwa sasa, jambo muhimu zaidi ni usalama wako na mwili wako. "
            "Kama una majeraha, tafadhali jaribu kupata matibabu — hata kama yanaonekana madogo, "
            "daktari anaweza kukutibu na pia kuandika kilichotokea, jambo ambalo linaweza kuwa muhimu baadaye ukichagua kuripoti.\n\n"
            "Kama bado uko katika nafasi moja na mtu aliyekuumiza na unahisi si salama, "
            "unaweza kupiga simu 999 au 112, au kufikia laini ya msaada ya GBV bure: 0800 720 990 (masaa 24/7).\n\n"
            "Huhitaji kufanya maamuzi makubwa sasa hivi. Lakini tafadhali jua kuna watu "
            "tayari kusimama nawe. Je, ungependa msaada kupata makazi au mahali salama karibu?"
        ),
    ),

    # ── LEAVING / WANTING TO LEAVE (high) ────────────────────────────────────
    (
        ["leave", "leaving", "escape", "run away", "get out", "want to go", "can't leave",
         "afraid to leave", "where can i go", "nataka kwenda", "kutoroka",
         "ningetaka kuondoka", "acha", "nina hofu ya kwenda", "wapi niweze kwenda"],
        "high",
        (
            "Wanting to leave takes courage — and the fear you feel about leaving is completely valid. "
            "Leaving is often the most dangerous time in an abusive relationship, and it's wise to plan carefully.\n\n"
            "You don't have to leave tonight if it's not safe to do so. But planning ahead can make it safer when you do.\n\n"
            "A safety plan might include:\n"
            "• Identifying a trusted person who can help you — a friend, relative, neighbour.\n"
            "• Keeping important documents (ID, birth certificates, financial records) accessible or with someone safe.\n"
            "• Having a small bag ready with essentials — clothes, medication, phone charger, cash.\n"
            "• Memorising key phone numbers in case your phone is taken.\n\n"
            "There are shelters in Kenya that can take you in — safely and confidentially:\n"
            "📞 GBV Recovery Line (free, 24/7): 0800 720 990\n"
            "📞 FIDA Kenya: 020 3875369\n\n"
            "You deserve a life where you feel safe. Let's figure out the next step together."
        ),
        (
            "Kutaka kwenda kunachukua ujasiri — na hofu unayohisi kuhusu kwenda ni sahihi kabisa. "
            "Kuondoka mara nyingi ni wakati hatari zaidi katika uhusiano wa unyanyasaji, na ni busara kupanga kwa makini.\n\n"
            "Huhitaji kuondoka usiku huu kama si salama kufanya hivyo. Lakini kupanga mapema kunaweza kuifanya salama zaidi utakapofanya hivyo.\n\n"
            "Mpango wa usalama unaweza kujumuisha:\n"
            "• Kutambua mtu unayemwamini ambaye anaweza kukusaidia — rafiki, ndugu, jirani.\n"
            "• Kuweka nyaraka muhimu (kitambulisho, vyeti vya kuzaliwa, kumbukumbu za kifedha) zinazopatikana au kwa mtu salama.\n"
            "• Kuwa na begi ndogo tayari na vitu muhimu — nguo, dawa, chaja ya simu, pesa taslimu.\n"
            "• Kukariri nambari muhimu za simu kwa sababu simu yako inaweza kuchukuliwa.\n\n"
            "Kuna makazi nchini Kenya ambayo yanaweza kukupokea — kwa usalama na usiri:\n"
            "📞 Laini ya GBV Recovery (bure, masaa 24/7): 0800 720 990\n"
            "📞 FIDA Kenya: 020 3875369\n\n"
            "Unastahili maisha ambapo unajisikia salama. Hebu tujue hatua inayofuata pamoja."
        ),
    ),

    # ── FINANCIAL / ECONOMIC ABUSE (medium) ──────────────────────────────────
    (
        ["money", "pesa", "salary", "mshahara", "account", "akaunti", "bank",
         "taking my", "controls my", "won't let me work", "took my", "alichukua",
         "anachukua", "can't afford", "left me with nothing", "financial", "economic",
         "debt", "deni", "no food", "hakuna chakula", "can't pay", "bills", "rent"],
        "medium",
        (
            "What you're describing is financial abuse — and it is a recognised, serious form of "
            "gender-based violence. Being cut off from money, having your income controlled or taken, "
            "or being prevented from working is not just unfair — it's a way of trapping you, and that "
            "trap was built deliberately.\n\n"
            "You are not weak for being in this situation. The dependency you feel was engineered by them.\n\n"
            "There are a few things that may help, whenever you feel ready:\n"
            "• You have a legal right to marital property and financial support in Kenya — "
            "FIDA Kenya (020 3875369) can advise you for free.\n"
            "• Kenya Legal Aid Centre (0800 723 253) offers free legal help on financial rights.\n"
            "• If you have children, you may be entitled to court-ordered child support.\n"
            "• Some shelters can help you get back on your feet financially, not just provide a safe space.\n\n"
            "You don't have to figure all of this out at once. What feels most urgent to you right now?"
        ),
        (
            "Unachokielezea ni unyanyasaji wa kifedha — na ni aina inayotambuliwa na mbaya ya "
            "unyanyasaji wa kijinsia. Kukatiliwa mbali na pesa, kuwa na mapato yako kudhibitiwa au kuchukuliwa, "
            "au kuzuiwa kufanya kazi si dhuluma tu — ni njia ya kukufunga, na mtego huo "
            "ulijengwa kwa makusudi.\n\n"
            "Huna udhaifu kwa kuwa katika hali hii. Utegemezi unaohisi uliundwa nao.\n\n"
            "Kuna mambo machache ambayo yanaweza kusaidia, ukiwa tayari:\n"
            "• Una haki ya kisheria ya mali ya ndoa na msaada wa kifedha nchini Kenya — "
            "FIDA Kenya (020 3875369) inaweza kukushauri bure.\n"
            "• Kituo cha Msaada wa Kisheria cha Kenya (0800 723 253) kinatoa msaada wa kisheria bure kuhusu haki za kifedha.\n"
            "• Kama una watoto, unaweza kuwa na haki ya msaada wa watoto ulioamriwa na mahakama.\n"
            "• Makazi fulani yanaweza kukusaidia kupata nguvu tena kifedha, si tu kutoa nafasi salama.\n\n"
            "Huhitaji kuelewa yote haya mara moja. Ni nini kinachoonekana muhimu zaidi kwako sasa hivi?"
        ),
    ),

    # ── EMOTIONAL / PSYCHOLOGICAL ABUSE (medium) ─────────────────────────────
    (
        ["shout", "yell", "scream", "threaten", "threat", "control", "isolate", "isolated",
         "jealous", "humiliate", "embarrass", "insult", "call me names", "crazy", "worthless",
         "manipulate", "gaslight", "no one will believe", "you're nothing", "stupid",
         "kutishia", "kudhibiti", "kudhalilisha", "kutengwa"],
        "medium",
        (
            "What you're describing is emotional and psychological abuse — and it is real, "
            "even when there are no visible marks. Abuse doesn't have to leave a bruise to cause serious harm.\n\n"
            "Being constantly shouted at, isolated from people you love, humiliated, "
            "or made to feel worthless wears something down inside you over time. "
            "You are not imagining it. You are not overreacting.\n\n"
            "The fact that you're reaching out tells me part of you knows this isn't okay — "
            "and that part of you is right.\n\n"
            "Speaking to a counsellor can be a powerful first step — not because something is wrong with you, "
            "but because you deserve a space where someone truly listens. "
            "Would you like help finding a counsellor or a support group near you?"
        ),
        (
            "Unachokielezea ni unyanyasaji wa kihisia na kisaikolojia — na ni wa kweli, "
            "hata wakati hakuna alama zinazoonekana. Unyanyasaji haulazimiki kuacha makovu kudhuru vibaya.\n\n"
            "Kupigwa kelele mara kwa mara, kutengwa na watu unaowapenda, kudhalilishwa, "
            "au kufanywa kujisikia huna thamani kunachomba kitu ndani yako kwa muda. "
            "Hujafikiria. Hukujibu kupita kiasi.\n\n"
            "Ukweli kwamba unatafuta msaada unaonyesha sehemu yako inajua hii si sawa — "
            "na sehemu hiyo ya wewe iko sawa.\n\n"
            "Kuzungumza na mshauri anaweza kuwa hatua ya kwanza yenye nguvu — si kwa sababu kuna kitu kibaya nawe, "
            "bali kwa sababu unastahili nafasi ambapo mtu anakusikiliza kweli kweli. "
            "Je, ungependa msaada kupata mshauri au kikundi cha msaada karibu nawe?"
        ),
    ),

    # ── DIGITAL / ONLINE ABUSE (medium) ──────────────────────────────────────
    (
        ["photos", "picha", "video", "online", "mtandao", "social media", "whatsapp",
         "shared my", "posted", "hacked", "tracking", "spying", "location",
         "threats online", "cyber", "internet", "blackmail", "mafisadi"],
        "medium",
        (
            "What's happening to you online is a real form of abuse — and it causes real harm, "
            "even if some people don't take it seriously. You are right to take it seriously.\n\n"
            "Under Kenya's Computer Misuse and Cybercrimes Act (2018), sharing intimate images without consent, "
            "online harassment, and cyber-stalking are all criminal offences. You have legal options.\n\n"
            "A few things that can help right now:\n"
            "• Screenshot and save evidence before reporting or removing anything.\n"
            "• Report the content to the platform (WhatsApp, Facebook, Instagram, etc.) using their abuse reporting tools.\n"
            "• Contact the Directorate of Criminal Investigations (DCI): 0800 722 203.\n"
            "• If someone is using your location to stalk or threaten you, consider turning off location sharing "
            "and letting a trusted person know.\n\n"
            "Would you like to talk more about what's happening so we can figure out the best next step for your situation?"
        ),
        (
            "Kinachokupata mtandaoni ni aina halisi ya unyanyasaji — na unasababisha madhara halisi, "
            "hata kama watu wengine hawachukui kwa uzito. Una haki ya kuichukua kwa uzito.\n\n"
            "Chini ya Sheria ya Matumizi Mabaya ya Kompyuta na Uhalifu wa Mtandao ya Kenya (2018), "
            "kushiriki picha za karibu bila idhini, unyanyasaji mtandaoni, na kufuatilia mtandaoni "
            "ni makosa ya jinai. Una chaguzi za kisheria.\n\n"
            "Mambo machache yanayoweza kusaidia sasa hivi:\n"
            "• Chukua picha za skrini na uhifadhi ushahidi kabla ya kuripoti au kuondoa chochote.\n"
            "• Ripoti maudhui kwenye jukwaa (WhatsApp, Facebook, Instagram, n.k.) ukitumia zana zao za kuripoti unyanyasaji.\n"
            "• Wasiliana na Directorate of Criminal Investigations (DCI): 0800 722 203.\n"
            "• Kama mtu anatumia mahali ulipo kukufuatilia au kukutishia, fikiria kuzima ushiriki wa mahali "
            "na kumjulisha mtu unayemwamini.\n\n"
            "Je, ungependa kuzungumza zaidi kuhusu kinachoendelea ili tuweze kujua hatua bora inayofuata kwa hali yako?"
        ),
    ),

    # ── UNSURE / NOT RECOGNISING ABUSE (low) ─────────────────────────────────
    (
        ["not sure", "i don't know", "sijui", "maybe it's my fault", "labda ni kosa langu",
         "am i overreacting", "is this abuse", "is this normal", "he loves me", "she loves me",
         "it's complicated", "confused", "ninachanganyikiwa"],
        "low",
        (
            "It takes real courage to even ask that question — 'is this abuse?' — and the fact that "
            "you're asking it tells me something important: something doesn't feel right to you.\n\n"
            "Abuse doesn't always look the way people expect. It can be subtle — "
            "someone making you doubt yourself, controlling who you see, taking your money, "
            "or making you feel like you're always wrong. Love should not feel like fear.\n\n"
            "You don't have to label what's happening to reach out for support. "
            "You don't need to have a 'bad enough' situation. "
            "If something is hurting you, that is enough.\n\n"
            "Can you tell me a little more about what's been happening? "
            "I'm here, and there's no rush."
        ),
        (
            "Inachukua ujasiri wa kweli hata kuuliza swali hilo — 'je, hii ni unyanyasaji?' — na ukweli kwamba "
            "unauliza unaniambia kitu muhimu: kitu hakionekani sawa kwako.\n\n"
            "Unyanyasaji haonekani kila wakati jinsi watu wanavyotarajia. Unaweza kuwa wa kina — "
            "mtu anakufanya kutilia shaka nafsi yako, kudhibiti unaowaona, kuchukua pesa zako, "
            "au kukufanya uhisi kama una makosa kila wakati. Upendo haupaswi kuhisi kama hofu.\n\n"
            "Huhitaji kuweka lebo kinachoendelea ili kutafuta msaada. "
            "Huhitaji kuwa na hali 'mbaya ya kutosha'. "
            "Kama kitu kinakuumiza, hiyo inatosha.\n\n"
            "Je, unaweza kunieleza zaidi kuhusu kilichokuwa kikiendelea? "
            "Niko hapa, na hakuna haraka."
        ),
    ),

    # ── GENERAL HELP / FIRST CONTACT (low) ───────────────────────────────────
    (
        ["help", "msaada", "support", "need help", "nahitaji msaada", "i need", "what do i do",
         "nifanye nini", "please", "tafadhali", "i'm scared", "ninaogopa", "afraid", "hofu"],
        "low",
        (
            "I'm really glad you reached out. Whatever brought you here today, you don't have to face it alone.\n\n"
            "This is a safe, confidential space. Nothing you share here will be used against you. "
            "There is no judgment here — only support.\n\n"
            "Can you tell me a little about what's happening? You can share as much or as little as you're comfortable with. "
            "I'll do my best to help you find the support that's right for your situation."
        ),
        (
            "Ninafurahi sana umewasiliana. Chochote kilichokuleta hapa leo, huhitaji kukabiliana nacho peke yako.\n\n"
            "Hii ni nafasi salama na ya siri. Hakuna kilichoshirikishwa hapa kitakachotumiwa dhidi yako. "
            "Hakuna hukumu hapa — msaada tu.\n\n"
            "Je, unaweza kunieleza kidogo kuhusu kinachoendelea? Unaweza kushiriki kadri unavyojisikia vizuri. "
            "Nitajaribu kukusaidia kupata msaada unaofaa kwa hali yako."
        ),
    ),
]

# Fallback when no rule matches
FALLBACK_RESPONSES = {
    "en": (
        "low",
        (
            "Thank you for trusting me with this. I want to make sure I understand what you're going through.\n\n"
            "Could you tell me a little more about your situation? "
            "Whatever it is — whether it involves physical harm, financial stress, "
            "something happening online, or something else entirely — you are in the right place, "
            "and there is no situation too small or too complicated for support.\n\n"
            "I'm here, and I'm listening."
        ),
    ),
    "sw": (
        "low",
        (
            "Asante kwa kuniambia hili. Nataka kuhakikisha ninaelewa unachopitia.\n\n"
            "Je, unaweza kunieleza zaidi kidogo kuhusu hali yako? "
            "Iwe ni nini — iwe inahusiana na madhara ya kimwili, msongo wa kifedha, "
            "kitu kinachoendelea mtandaoni, au kitu kingine kabisa — uko mahali sahihi, "
            "na hakuna hali ndogo mno au ngumu mno kwa msaada.\n\n"
            "Niko hapa, na ninakusikiliza."
        ),
    ),
}


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────

def detect_language(text: str) -> str:
    swahili_markers = [
        "nina", "niko", "ninajua", "tafadhali", "asante", "habari", "msaada",
        "nataka", "sijui", "nifanye", "anipiga", "ananipiga", "alipiga",
        "pesa", "watoto", "mtoto", "hofu", "ninaogopa", "kwenda", "kutoroka",
        "ubakaji", "alibaka", "anabaka", "kudhibiti", "kutishia",
    ]
    text_lower = text.lower()
    score = sum(1 for marker in swahili_markers if marker in text_lower)
    return "sw" if score >= 2 else "en"


def match_response(text: str, language: str):
    """Return (risk_level, response_text) from rule matching."""
    text_lower = text.lower()
    best_match = None
    best_score = 0

    # Priority order for risk levels when scores tie
    risk_priority = {"critical": 4, "high": 3, "medium": 2, "low": 1}

    for keywords, risk, en_response, sw_response in RESPONSE_RULES:
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > best_score or (
            score == best_score and best_match and
            risk_priority.get(risk, 0) > risk_priority.get(best_match[0], 0)
        ):
            best_score = score
            response_text = sw_response if language == "sw" else en_response
            best_match = (risk, response_text)

    if best_match:
        return best_match

    fallback_risk, fallback_text = FALLBACK_RESPONSES.get(language, FALLBACK_RESPONSES["en"])
    return fallback_risk, fallback_text


def build_hotlines(risk_level: str, language: str) -> str:
    """Append hotlines for medium/high/critical situations."""
    if risk_level == "low":
        return ""
    if language == "sw":
        return (
            "\n\n---\n"
            "📞 **Laini ya GBV (bure, masaa 24/7):** 0800 720 990\n"
            "📞 **Dharura:** 999 au 112\n"
            "📞 **FIDA Kenya:** 020 3875369\n"
            "📞 **Childline Kenya:** 116"
        )
    return (
        "\n\n---\n"
        "📞 **GBV Recovery Line (free, 24/7):** 0800 720 990\n"
        "📞 **Emergency:** 999 or 112\n"
        "📞 **FIDA Kenya:** 020 3875369\n"
        "📞 **Childline Kenya:** 116"
    )


def extract_risk_from_claude_response(text: str) -> str:
    """Extract the [RISK:level] tag that Claude embeds in its response."""
    import re
    match = re.search(r'\[RISK:(critical|high|medium|low)\]', text, re.IGNORECASE)
    if match:
        return match.group(1).lower()
    # Fallback: infer from keywords in response
    text_lower = text.lower()
    if any(w in text_lower for w in ["999", "112", "immediate danger", "weapon", "call now"]):
        return "critical"
    if any(w in text_lower for w in ["emergency", "shelter", "safety plan", "unsafe"]):
        return "high"
    if any(w in text_lower for w in ["0800", "medical", "report", "counsellor"]):
        return "medium"
    return "low"


def strip_risk_tag(text: str) -> str:
    """Remove the [RISK:...] tag from the response before sending to user."""
    import re
    return re.sub(r'\s*\[RISK:(critical|high|medium|low)\]', '', text, flags=re.IGNORECASE).strip()


# ─────────────────────────────────────────────
#  PUBLIC API
# ─────────────────────────────────────────────

async def get_ai_response(
    message: str,
    conversation_history: Optional[list] = None,
    language: str = "en",
) -> dict:
    """
    Returns { "response": str, "risk_level": str }
    risk_level is one of: "low" | "medium" | "high" | "critical"
    Tries Claude API first; falls back to empathetic rule-based stub.
    """
    detected_lang = detect_language(message) if language == "en" else language

    # ── Try online (Claude API) ──────────────────────────────────────────
    if CLAUDE_API_KEY:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

            messages = []
            if conversation_history:
                for turn in conversation_history[-8:]:
                    messages.append({"role": turn["role"], "content": turn["content"]})
            messages.append({"role": "user", "content": message})

            completion = client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=messages,
            )

            raw_text = completion.content[0].text
            risk = extract_risk_from_claude_response(raw_text)
            clean_response = strip_risk_tag(raw_text)

            return {"response": clean_response, "risk_level": risk}

        except Exception as e:
            print(f"[Lifeline] Claude API error, using offline stub: {e}")

    # ── Offline stub ─────────────────────────────────────────────────────
    risk_level, response_text = match_response(message, detected_lang)
    hotlines = build_hotlines(risk_level, detected_lang)
    full_response = response_text + hotlines

    return {"response": full_response, "risk_level": risk_level}
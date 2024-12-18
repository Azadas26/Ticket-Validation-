import { Recipient } from "./Recipient";
import { Sender } from "./Sender";
import { Attachment } from "./Attachment";
import { Personalization } from "../../modules/Email.module";
export declare class EmailParams {
    from: Sender;
    to: Recipient[];
    cc?: Recipient[];
    bcc?: Recipient[];
    reply_to?: Recipient;
    subject: string;
    text: string;
    html: string;
    send_at: number;
    attachments?: Attachment[];
    template_id?: string;
    in_reply_to?: string;
    tags?: string[];
    personalization?: Personalization[];
    settings?: EmailSettings[];
    precedence_bulk?: boolean;
    constructor(config?: any);
    setFrom(from: Sender): EmailParams;
    setTo(to: Recipient[]): EmailParams;
    setCc(cc: Recipient[]): EmailParams;
    setBcc(bcc: Recipient[]): EmailParams;
    setReplyTo(replyTo: Recipient): EmailParams;
    setInReplyTo(inReplyTo: string): EmailParams;
    setSubject(subject: string): EmailParams;
    setText(text: string): EmailParams;
    setHtml(html: string): EmailParams;
    setSendAt(sendAt: number): EmailParams;
    setAttachments(attachments: Attachment[]): EmailParams;
    setTemplateId(id: string): EmailParams;
    setTags(tags: string[]): EmailParams;
    setPersonalization(personalization: Personalization[]): EmailParams;
    setPrecedenceBulk(precedenceBulk: boolean): EmailParams;
    setSettings(settings: EmailSettings[]): EmailParams;
}
export interface EmailSettings {
    track_clicks?: boolean;
    track_opens?: boolean;
    track_content?: boolean;
}

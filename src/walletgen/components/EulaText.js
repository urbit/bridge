import React from 'react'

// EULA
const EulaText = () =>
  <span className={'legal'}>
    <h2>Terms of Use</h2>

    <p>This agreement (these <b>“Terms”</b>) governs the terms under which you may access and use the Wallet Generator software (the <b>“Software”</b>) made available to you by Tlon Corporation (“Tlon”, <b>“we”</b> or <b>“us”</b>). By clicking “I Accept,” or by downloading, installing, or otherwise accessing or using the Software, you agree that you have read and understood, and, as a condition to your use of the Software, you agree to be bound by, the following terms and conditions.
    </p>

    <p>
    <b>BY CLICKING “I ACCEPT,” OR BY DOWNLOADING, INSTALLING, OR OTHERWISE ACCESSING OR USING THE SOFTWARE</b>, YOU AGREE THAT YOU HAVE READ AND UNDERSTOOD, AND, AS A CONDITION TO YOUR USE OF THE SOFTWARE, YOU AGREE TO BE BOUND BY, THE FOLLOWING TERMS AND CONDITIONS (THESE “<b>TERMS</b>”). IF YOU ARE NOT ELIGIBLE, OR DO NOT AGREE TO THE TERMS, THEN YOU DO NOT HAVE OUR PERMISSION TO USE THE SOFTWARE. YOUR USE OF THE SOFTWARE, AND TLON’S PROVISION OF THE SOFTWARE TO YOU, CONSTITUTES AN AGREEMENT BY TLON AND BY YOU TO BE BOUND BY THESE TERMS.
    </p>

    <p>
      <b><u>MATERIAL TERMS</u>: AS PROVIDED IN GREATER DETAIL IN THESE TERMS (AND WITHOUT LIMITING THE EXPRESS LANGUAGE OF THESE TERMS), YOU ACKNOWLEDGE THE FOLLOWING:</b>
    </p>

    <ul>
      <li><p><b>
      WE DO NOT HOLD, BACK-UP OTHERWISE HAVE ANY ACCESS TO YOUR KEYS (DEFINED IN SECTION 1), SO YOU ARE SOLELY RESPONSIBLE FOR ANY LOSS OF THE SAME, AND YOU ARE SOLELY RESPONSIBLE FOR MAINTAINING ALL INFORMATION NECESSARY TO ACCESS YOUR KEYS AND WALLET;
      </b></p></li>
      <li><p><b>
      WE HAVE NO LIABILITY WHATSOEVER FOR ANY SECURITY PROBLEMS OR INCIDENTS THAT YOU MAY EXPERIENCE IN CONNECTION WITH ANY USE OF THE SOFTWARE, INCLUDING ANY LOSS OR THEFT OF YOUR KEYS OR ANY PROBLEMS THAT MAY ARISE IN CONNECTION WITH YOUR WALLET;
      </b></p></li>
      <li><p><b>
      THE SOFTWARE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND AND OUR LIABILITY TO YOU IN CONNECTION WITH THE SAME IS LIMITED; AND
      </b></p></li>
      <li><p><b>
      ALL DISPUTES ARISING UNDER THESE TERMS WILL BE RESOLVED THROUGH BINDING ARBITRATION AND YOU AND TLON ARE EACH WAIVING THE RIGHT TO A TRIAL BY JURY OR TO PARTICIPATE IN A CLASS ACTION.
      </b></p></li>
    </ul>

    <ol>
      <li>
        <p><b>Software Overview.</b> The Software is an interface that you can use to generate a hierarchical deterministic wallet that enables the creation of child keys from parent keys in a hierarchy (“Wallet”).  Those keys can be private keys or can involve a public Ethereum Wallet address that can be used to send and receive Urbit address space in transactions with third parties (such private keys and public addresses, the “Keys”). The Software may only be used if you are disconnected from the internet and will automatically close if it detects an internet connection. Tlon recommends that you use the Software only on an airgapped machine.</p>
      </li>
      <li>
        <p><b>Eligibility.</b> You must be at least 18 years old to use the Software. By agreeing to these Terms, you represent and warrant to us that: (a) you are at least 18 years old; (b) your registration and your use of the Software is in compliance with any and all applicable laws and regulations; and (c) that all information you submit in connection with your download or use of the Software is truthful and accurate.
        </p>
      </li>
      <li>
        <p><b>License.</b></p>
        <ol>
          <li>
            <p><b>Limited License.</b> Subject to your complete and ongoing compliance with these Terms, Tlon grants you, solely for your personal use, a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to install and use one object code copy of the Software.
            </p>
          </li>
          <li>
            <p><b>License Restrictions.</b> Except and solely to the extent such a restriction is impermissible under applicable law, you may not: (a) reproduce, distribute, publicly display, or publicly perform the Software; (b) make modifications to the Software; or (c) interfere with or circumvent any feature of the Software, including any security or access control mechanism. If you are prohibited under applicable law from using the Software, you may not use it.
            </p>
          </li>
          <li>
            <p><b>Feedback.</b> If you choose to provide input and suggestions regarding problems with or proposed modifications or improvements to the Software (“<b>Feedback</b>”), then you hereby grant Tlon an unrestricted, perpetual, irrevocable, non-exclusive, fully-paid, royalty-free right to exploit the Feedback in any manner and for any purpose, including to improve the Software and create other products and services.
            </p>
          </li>
        </ol>
      </li>

      <li>
        <p><b>Ownership; Proprietary Rights.</b> The Software is owned and operated by Tlon. The visual interfaces, graphics, design, compilation, information, data, computer code (including source code or object code), products, software, services, and all other elements of the Software (“<b>Materials</b>”) provided by Tlon are protected by intellectual property and other laws. All Materials included in the Software are the property of Tlon or its third party licensors. Except as expressly authorized by Tlon, you may not make use of the Materials. Tlon reserves all rights to the Materials not granted expressly in these Terms.
        </p>
      </li>

      <li>
        <p><b>Third Party Software.</b> The Software may include or incorporate third party software components that are generally available free of charge under licenses granting recipients broad rights to copy, modify, and distribute those components (“<b>Third Party Components</b>”). Although the Software is provided to you subject to these Terms, nothing in these Terms prevents, restricts, or is intended to prevent or restrict you from obtaining Third Party Components under the applicable third party licenses or to limit your use of Third Party Components under those third party licenses.
        </p>
      </li>

      <li>
        <p><b>Prohibited Conduct.</b> BY USING THE SOFTWARE YOU AGREE NOT TO, AND AGREE NOT TO ATTEMPT TO OR PERMIT ANY OTHER PERSON TO:
        </p>
        <ol className={'ls-alpha'}>
          <li><p>use the Software for any illegal purpose or in violation of any local, state, national, or international law;
          </p></li>
          <li><p>interfere with security-related features of the Software, including by: (i) disabling or circumventing features that prevent or limit use or copying of any content; or (ii) reverse engineering or otherwise attempting to discover the source code of any portion of the Software except to the extent that the activity is expressly permitted by applicable law, or except to the extent that Tlon has made such source code available to the public;
          </p></li>
          <li><p>perform any fraudulent activity including impersonating any person or entity, claiming a false affiliation, accessing any other Software account without permission; or
          </p></li>
          <li><p>sell or otherwise transfer the access granted under these Terms or any Materials (as defined in Section 4) or any right or ability to view, access, or use any Materials.
          </p></li>
        </ol>
      </li>

      <li>
        <p><b>Term, Termination and Modification of the Software.</b> These Terms are effective beginning when you accept the Terms or first download, install, access, or use the Software, and ending when terminated as described in this Section. If you violate any provision of these Terms, your authorization to access the Software and these Terms automatically terminate. In addition, Tlon may, at its sole discretion, terminate these Terms or suspend or terminate your right to access to the Software, at any time for any reason or no reason, with or without notice. Tlon reserves the right to modify or discontinue the Software at any time (including by limiting or discontinuing certain features of the Software), temporarily or permanently, without notice to you. Tlon will have no liability for any change to the Software or any suspension or termination of your access to or use of the Software. Upon any termination of these Terms, you must permanently delete all copies of the Software within your possession or control, and Sections 3.3, 4, 8, 9, 10, 11, and 12 will survive.
        </p>
      </li>

      <li>
        <p><b>Indemnity.</b> To the fullest extent permitted by law, you are responsible for your use of the Software, and you will defend and indemnify Tlon and its officers, directors, employees, consultants, affiliates, subsidiaries and agents (together, the “Tlon Entities”) from and against every claim brought by a third party, and any related liability, damage, loss, and expense, including reasonable attorneys’ fees and costs, arising out of or connected with: (a) your use of, or misuse of, the Software; and (b) your violation of any portion of these Terms, any representation, warranty, or any applicable law or regulation. We reserve the right, at our own expense, to assume the exclusive defense and control of any matter otherwise subject to indemnification by you (without limiting your indemnification obligations with respect to that matter), and in that case, you agree to cooperate with our defense of those claims.
        </p>
      </li>

      <li>
        <p><b>Disclaimers; No Warranties.</b> </p>
        <p>THE SOFTWARE AND ALL MATERIALS AND CONTENT AVAILABLE THROUGH THE SOFTWARE ARE PROVIDED “AS IS” AND ON AN “AS AVAILABLE” BASIS. TLON DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, RELATING TO THE SOFTWARE AND ALL MATERIALS AND CONTENT AVAILABLE THROUGH THE SOFTWARE, INCLUDING: (A) ANY IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, OR NON-INFRINGEMENT; AND (B) ANY WARRANTY ARISING OUT OF COURSE OF DEALING, USAGE, OR TRADE. TLON DOES NOT WARRANT THAT THE SOFTWARE OR ANY PORTION OF THE SOFTWARE, OR ANY MATERIALS OR CONTENT OFFERED THROUGH THE SOFTWARE, WILL BE UNINTERRUPTED, SECURE, OR FREE OF ERRORS, VIRUSES, OR OTHER HARMFUL COMPONENTS, AND TLON DOES NOT WARRANT THAT ANY OF THOSE ISSUES WILL BE CORRECTED.
        </p>
        <p>NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED BY YOU FROM THE SOFTWARE OR TLON ENTITIES OR ANY MATERIALS OR CONTENT AVAILABLE THROUGH THE SOFTWARE WILL CREATE ANY WARRANTY REGARDING ANY OF THE TLON ENTITIES OR THE SOFTWARE THAT IS NOT EXPRESSLY STATED IN THESE TERMS. WE ARE NOT RESPONSIBLE FOR ANY DAMAGE THAT MAY RESULT FROM THE SOFTWARE.
        </p>
        <p><b>YOU ARE SOLELY RESPONSIBLE FOR RECORDING AND SAFEGUARDING YOUR KEYS AND ANY INFORMATION THAT YOU MAY NEED TO RECOVER THE SAME. YOU UNDERSTAND AND AGREE THAT YOU USE ANY PORTION OF THE SOFTWARE AT YOUR OWN DISCRETION AND RISK, AND THAT WE ARE NOT RESPONSIBLE FOR ANY DAMAGE TO YOUR PROPERTY (INCLUDING YOUR COMPUTER SYSTEM OR MOBILE DEVICE USED IN CONNECTION WITH THE SOFTWARE) OR ANY LOSS OF DATA OR OTHER PROPERTY OR ASSETS YOU MAY OWN OR CONTROL IN CONNECTION WITH YOUR USE OF THE SOFTWARE, KEYS OR WALLET, INCLUDING ANY LOSS OF ACCESS TO YOUR WALLET OR KEYS.
        </b></p>
        <p>THE LIMITATIONS, EXCLUSIONS AND DISCLAIMERS IN THIS SECTION APPLY TO THE FULLEST EXTENT PERMITTED BY LAW. Tlon does not disclaim any warranty or other right that Tlon is prohibited from disclaiming under applicable law.
        </p>
      </li>

      <li>
        <p><b>Limitation of Liability</b></p>
        <p>TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL THE TLON ENTITIES BE LIABLE TO YOU FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES (INCLUDING DAMAGES FOR LOSS OF PROFITS, GOODWILL, OR ANY OTHER INTANGIBLE LOSS) ARISING OUT OF OR RELATING TO YOUR ACCESS TO OR USE OF, OR YOUR INABILITY TO ACCESS OR USE OR ANY OTHER PROBLEMS WITH, THE SOFTWARE, YOUR WALLET OR KEYS, OR ANY MATERIALS OR CONTENT WITHIN THE SOFTWARE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT ANY TLON ENTITY HAS BEEN INFORMED OF THE POSSIBILITY OF DAMAGE.
        </p>
        <p>TO THE FULLEST EXTENT PERMITTED BY LAW AND EXCEPT AS OTHERWISE SET FORTH IN SECTION 11, THE AGGREGATE LIABILITY OF THE TLON ENTITIES TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE USE OF OR ANY INABILITY TO USE ANY PORTION OF THE SOFTWARE OR OTHERWISE UNDER THESE TERMS, WHETHER IN CONTRACT, TORT, OR OTHERWISE, IS LIMITED TO $100.
        </p>
        <p>EACH PROVISION OF THESE TERMS THAT PROVIDES FOR A LIMITATION OF LIABILITY, DISCLAIMER OF WARRANTIES, OR EXCLUSION OF DAMAGES IS INTENDED TO AND DOES ALLOCATE THE RISKS BETWEEN THE PARTIES UNDER THESE TERMS. THIS ALLOCATION IS AN ESSENTIAL ELEMENT OF THE BASIS OF THE BARGAIN BETWEEN THE PARTIES. EACH OF THESE PROVISIONS IS SEVERABLE AND INDEPENDENT OF ALL OTHER PROVISIONS OF THESE TERMS. THE LIMITATIONS IN THIS SECTION 10 WILL APPLY EVEN IF ANY LIMITED REMEDY FAILS OF ITS ESSENTIAL PURPOSE.
        </p>
      </li>

      <li>
        <p><b>Dispute Resolution and Arbitration</b></p>
        <ol>
          <li><p><b>Generally.</b> In the interest of resolving disputes between you and Tlon in the most expedient and cost effective manner, and except as described in Section 11.2, you and Tlon agree that every dispute arising in connection with these Terms will be resolved by binding arbitration. Arbitration is less formal than a lawsuit in court. Arbitration uses a neutral arbitrator instead of a judge or jury, may allow for more limited discovery than in court, and can be subject to very limited review by courts. Arbitrators can award the same damages and relief that a court can award. This agreement to arbitrate disputes includes all claims arising out of or relating to any aspect of these Terms, whether based in contract, tort, statute, fraud, misrepresentation, or any other legal theory, and regardless of whether a claim arises during or after the termination of these Terms. YOU UNDERSTAND AND AGREE THAT, BY ENTERING INTO THESE TERMS, YOU AND Tlon ARE EACH WAIVING THE RIGHT TO A TRIAL BY JURY OR TO PARTICIPATE IN A CLASS ACTION.
          </p></li>
          <li><p><b>Exceptions.</b>  Despite the provisions of Section 11.1, nothing in these Terms will be deemed to waive, preclude, or otherwise limit the right of either party to: (a) bring an individual action in small claims court; (b) pursue an enforcement action through the applicable federal, state, or local agency if that action is available; (c) seek injunctive relief in a court of law in aid of arbitration; or (d) to file suit in a court of law to address an intellectual property infringement claim.
          </p></li>
          <li><p><b>Arbitrator.</b> Any arbitration between you and Tlon will be settled under the Federal Arbitration Act and administered by the American Arbitration Association (“AAA”) under its Consumer Arbitration Rules (collectively, “AAA Rules”) as modified by these Terms. The AAA Rules and filing forms are available online at www.adr.org, by calling the AAA at 1-800-778-7879, or by contacting Tlon. The arbitrator has exclusive authority to resolve any dispute relating to the interpretation, applicability, or enforceability of this binding arbitration agreement.
          </p></li>
          <li><p><b>Notice of Arbitration; Process.</b> A party who intends to seek arbitration must first send a written notice of the dispute to the other party by certified U.S. Mail or by Federal Express (signature required) or, only if that other party has not provided a current physical address, then by electronic mail (“<b>Notice of Arbitration</b>”). Tlon’s address for Notice is: Tlon Corporation, 584 Market St. #56196, San Francisco, CA 94104. The Notice of Arbitration must: (a) describe the nature and basis of the claim or dispute; and (b) set forth the specific relief sought (“<b>Demand</b>”). The parties will make good faith efforts to resolve the claim directly, but if the parties do not reach an agreement to do so within 30 days after the Notice of Arbitration is received, you or Tlon may commence an arbitration proceeding. All arbitration proceedings between the parties will be confidential unless otherwise agreed by the parties in writing. During the arbitration, the amount of any settlement offer made by you or Tlon must not be disclosed to the arbitrator until after the arbitrator makes a final decision and award, if any. If the arbitrator awards you an amount higher than the last written settlement amount offered by Tlon in settlement of the dispute prior to the award, Tlon will pay to you the higher of: (i) the amount awarded by the arbitrator; or (ii) $10,000.
          </p></li>
          <li><p><b>Fees.</b>  If you commence arbitration in accordance with these Terms, Tlon will reimburse you for your payment of the filing fee, unless your claim is for more than $10,000, in which case the payment of any fees will be decided by the AAA Rules. Any arbitration hearing will take place at a location to be agreed upon in San Francisco County, California, but if the claim is for $10,000 or less, you may choose whether the arbitration will be conducted: (a) solely on the basis of documents submitted to the arbitrator; (b) through a non-appearance based telephone hearing; or (c) by an in-person hearing as established by the AAA Rules in the county (or parish) of your billing address. If the arbitrator finds that either the substance of your claim or the relief sought in the Demand is frivolous or brought for an improper purpose (as measured by the standards set forth in Federal Rule of Civil Procedure 11(b)), then the payment of all fees will be governed by the AAA Rules. In that case, you agree to reimburse Tlon for all monies previously disbursed by it that are otherwise your obligation to pay under the AAA Rules. Regardless of the manner in which the arbitration is conducted, the arbitrator must issue a reasoned written decision sufficient to explain the essential findings and conclusions on which the decision and award, if any, are based. The arbitrator may make rulings and resolve disputes as to the payment and reimbursement of fees or expenses at any time during the proceeding and upon request from either party made within 14 days of the arbitrator’s ruling on the merits.
          </p></li>
          <li><p><b>No Class Actions.</b>  YOU AND TLON AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING. Further, unless both you and Tlon agree otherwise, the arbitrator may not consolidate more than one person’s claims, and may not otherwise preside over any form of a representative or class proceeding.
          </p></li>
          <li><p><b>Modifications to this Arbitration Provision.</b> If Tlon makes any future change to this arbitration provision, other than a change to Tlon’s address for Notice of Arbitration, you may reject the change by sending us written notice within 30 days of the change to Tlon’s address for Notice of Arbitration, in which case your account with Tlon will be immediately terminated and this arbitration provision, as in effect immediately prior to the changes you rejected will survive.
          </p></li>
          <li><p><b>Enforceability.</b> If Section 11.6 is found to be unenforceable or if the entirety of this Section 11 is found to be unenforceable, then the entirety of this Section 11 will be null and void and, in that case, the parties agree that the exclusive jurisdiction and venue described in Section 12 will govern any action arising out of or related to these Terms.
          </p></li>
        </ol>
      </li>

      <li><p><b>Miscellaneous.</b> Your use of the Software is subject to all additional terms, policies, rules, or guidelines applicable to the Software or certain features of the Software that we may post on or link to from the Software (the “Additional Terms”). All Additional Terms are incorporated by this reference into, and made a part of, these Terms. You may not assign or transfer these Terms or your rights under these Terms, in whole or in part, by operation of law or otherwise, without our prior written consent. We may assign these Terms at any time without notice or consent. The failure to require performance of any provision will not affect our right to require performance at any other time after that, nor will a waiver by us of any breach or default of these Terms, or any provision of these Terms, be a waiver of any subsequent breach or default or a waiver of the provision itself. If any part of these Terms is held to be invalid or unenforceable, the unenforceable part will be given effect to the greatest extent possible, and the remaining parts will remain in full force and effect.  These Terms are governed by the laws of the State of California without regard to conflict of law principles. You and Tlon submit to the personal and exclusive jurisdiction of the state courts and federal courts located within San Francisco County, California for resolution of any lawsuit or court proceeding permitted under these Terms. We are under no obligation to provide support for the Software. In instances where we may offer support, the support will be subject to published policies.
      </p></li>

    </ol>

  </span>

export default EulaText

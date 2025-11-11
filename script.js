// ដាក់ Web App URL របស់អ្នកនៅទីនេះ
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyLZJKLt54krSRDDQ_JnXP1l_axP78xdEioh_I0vAqkm1_bNVgmCtCNALgm3afi030A/exec'; // <--- !!! ត្រូវប្រាកដថាបានដាក់ URL របស់អ្នក

// === Function សម្រាប់ Update ផ្ទាំងរាប់ចំនួន ===
function updateCounters() {
    const doneCount = document.querySelectorAll('.member-item-wrapper[data-status="done"]').length;
    const notDoneCount = document.querySelectorAll('.member-item-wrapper[data-status="not-done"]').length;
    document.getElementById('done-count').textContent = doneCount;
    document.getElementById('not-done-count').textContent = notDoneCount;
}

document.addEventListener('DOMContentLoaded', () => {
    // កំណត់ថ្ងៃ ខែ ឆ្នាំ បច្ចុប្បន្ន
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('report-date').value = today;

    // ចាប់ផ្តើមទាញយកបញ្ជីឈ្មោះសមាជិក
    fetchMembers();

    // Event Listeners សម្រាប់ប៊ូតុង
    document.getElementById('generate-report').addEventListener('click', generateReport);
    document.getElementById('copy-report').addEventListener('click', copyReport);
});

// 1. ទាញយកទិន្នន័យពី Google Apps Script
async function fetchMembers() {
    const memberListBody = document.getElementById('member-list-body');
    memberListBody.innerHTML = '<p>កំពុងទាញយកទិន្នន័យសមាជិក...</p>';

    try {
        const response = await fetch(GAS_WEB_APP_URL);
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        memberListBody.innerHTML = '';
        document.getElementById('total-count').textContent = data.members.length;
        
        data.members.forEach((member, index) => {
            const itemWrapper = document.createElement('div');
            itemWrapper.className = 'member-item-wrapper';
            itemWrapper.setAttribute('data-status', 'pending'); 
            // យើងរក្សាទុក Telegram User នៅទីនេះ
            itemWrapper.setAttribute('data-telegram', member.telegram); 
            // យើងរក្សាទុកឈ្មោះសុទ្ធ (គ្មានលេខរៀង) នៅទីនេះ
            itemWrapper.setAttribute('data-name', member.name); 

            itemWrapper.innerHTML = `
                <div class="member-chip">
                    <span class="member-name-chip">${index + 1}. ${member.name}</span>
                    <div class="button-group-chip">
                        <button class="btn-done">✅ បានធ្វើ</button>
                        <button class="btn-not-done">❌ មិនបានធ្វើ</button>
                    </div>
                </div>
                
                <div class="action-details">
                    <div class="link-box">
                        <label>សូមដាក់ Link:</label>
                        <input type="text" class="link-input" placeholder="https://...">
                    </div>
                    
                    <div class="reason-box">
                        <label>សូមជ្រើសរើសមូលហេតុ:</label>
                        <select class="reason-select">
                            <option value="ទូរស័ព្ទខូច">ទូរស័ព្ទខូច</option>
                            <option value="ទូរស័ព្ទថតមិនច្បាស់">ទូរស័ព្ទថតមិនច្បាស់</option>
                            <option value="ឈឺ">ឈឺ</option>
                            <option value="មិនបានធ្វើ">មិនបានធ្វើ</option>
                        </select>
                        <span class="telegram-user">Telegram: ${member.telegram}</span>
                    </div>
                </div>
            `;
            memberListBody.appendChild(itemWrapper);
        });

        addMemberButtonListeners();
        updateCounters();

    } catch (error) {
        memberListBody.innerHTML = `<p style="color: red;">Error: មិនអាចទាញទិន្នន័យបានទេ។ (${error.message})</p>`;
        console.error('Fetch error:', error);
    }
}

// 2. បន្ថែម Event Listeners ទៅប៊ូតុង
function addMemberButtonListeners() {
    document.querySelectorAll('.member-item-wrapper').forEach(itemWrapper => {
        const btnDone = itemWrapper.querySelector('.btn-done');
        const btnNotDone = itemWrapper.querySelector('.btn-not-done');
        const actionDetails = itemWrapper.querySelector('.action-details');
        const linkBox = itemWrapper.querySelector('.link-box');
        const reasonBox = itemWrapper.querySelector('.reason-box');

        btnDone.addEventListener('click', () => {
            itemWrapper.setAttribute('data-status', 'done');
            actionDetails.classList.add('visible');
            linkBox.style.display = 'block';
            reasonBox.style.display = 'none';
            btnDone.classList.add('active');
            btnNotDone.classList.remove('active');
            updateCounters();
        });

        btnNotDone.addEventListener('click', () => {
            itemWrapper.setAttribute('data-status', 'not-done');
            actionDetails.classList.add('visible');
            linkBox.style.display = 'none';
            reasonBox.style.display = 'block';
            btnNotDone.classList.add('active');
            btnDone.classList.remove('active');
            updateCounters();
        });
    });
}

// ==========================================================
// === START: កូដថ្មីសម្រាប់ Function GenerateReport ===
// ==========================================================
function generateReport() {
    // 1. ទាញយកព័ត៌មានទូទៅ
    const rawDate = document.getElementById('report-date').value;
    const groupInfo = document.getElementById('group-info').value;
    const topic = document.getElementById('report-topic').value;

    let formattedDate = 'N/A';
    if (rawDate) {
        const parts = rawDate.split('-');
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // 2. ទាញយក List អ្នក "បានធ្វើ" និង "មិនបានធ្វើ"
    const doneItems = document.querySelectorAll('.member-item-wrapper[data-status="done"]');
    const notDoneItems = document.querySelectorAll('.member-item-wrapper[data-status="not-done"]');
    const totalMembers = document.querySelectorAll('.member-item-wrapper').length;

    const doneCount = doneItems.length;
    const notDoneCount = notDoneItems.length;

    // 3. បង្កើតបញ្ជីឈ្មោះអ្នក "បានធ្វើ" (តាម Format ថ្មី)
    let doneListText = [];
    doneItems.forEach((item, index) => {
        // ប្រើ data-name ដើម្បីទទួលបានឈ្មោះសុទ្ធ (ដោយគ្មានលេខរៀង)
        const name = item.getAttribute('data-name'); 
        const link = item.querySelector('.link-input').value || '(មិនបានដាក់ Link)';
        
        doneListText.push(
            `${index + 1} .${name}\n${link}` // Format: 1 .ស៊ុយ សីហា\nhttps://...
        );
    });

    // 4. បង្កើតបញ្ជីឈ្មោះអ្នក "មិនបានធ្វើ" (តាម Format ថ្មី)
    let notDoneListText = [];
    notDoneItems.forEach((item, index) => {
        // ប្រើ data-name ដើម្បីទទួលបានឈ្មោះសុទ្ធ
        const name = item.getAttribute('data-name'); 
        const reason = item.querySelector('.reason-select').value;
        // ប្រើ data-telegram ដើម្បីទទួលបាន Username
        const telegram = item.getAttribute('data-telegram') || ''; 
        
        notDoneListText.push(
            `${index + 1}. ${name} (${reason}) ${telegram}` // Format: 1. ឈន សួង (ទូរស័ព្ទខូច) @Chhnsoung
        );
    });

    // 5. បង្កើតទម្រង់របាយការណ៍ចុងក្រោយ (តាមគំរូ EX)
    const reportText = `
សូមគេារពរបាយការណ៍មេ 🙏🏼 Date : ${formattedDate}
${groupInfo} មានសមាជិកសរុបចំនួន ${totalMembers} នាក់ទាំងមេក្រុម

${topic}

+ អ្នកបានធ្វេីចំនួន =${String(doneCount).padStart(2, '0')}នាក់

${doneListText.join('\n\n')}

+ អ្នកមិនបានធ្វេីចំនួន = ${String(notDoneCount).padStart(2, '0')}នាក់

${notDoneListText.join('\n\n')}

សូមអរគុណ🙏🏻❤️
`;
    
    // 6. បង្ហាញរបាយការណ៍ក្នុង Textarea
    document.getElementById('report-output').value = reportText.trim();
}
// ==========================================================
// === END: កូដថ្មីសម្រាប់ Function GenerateReport ===
// ==========================================================


// 4. ចម្លងរបាយការណ៍ (រក្សាទុកដដែល)
function copyReport() {
    const reportOutput = document.getElementById('report-output');
    if (!reportOutput.value) {
        alert('សូមបង្កើតរបាយការណ៍ជាមុនសិន!');
        return;
    }
    navigator.clipboard.writeText(reportOutput.value).then(() => {
        alert('ចម្លងរបាយការណ៍បានជោគជ័យ!');
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}
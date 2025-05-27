let html5QrCode;
let currentScannedStudent = null; // Untuk menyimpan data siswa yang sedang discan
let isQrScannerRunning = false; // Status untuk melacak scanner

// --- FUNGSI NAVIGASI ---
function showSection(sectionId) {
    // Sembunyikan semua section
    document.getElementById('siswa-section').style.display = 'none';
    document.getElementById('guru-section').style.display = 'none';

    // Nonaktifkan semua tombol navigasi
    document.getElementById('btn-siswa').classList.remove('active');
    document.getElementById('btn-guru').classList.remove('active');

    // Tampilkan section yang dipilih
    document.getElementById(sectionId + '-section').style.display = 'block';

    // Aktifkan tombol navigasi yang dipilih
    document.getElementById('btn-' + sectionId).classList.add('active');

    // Kelola scanner QR saat beralih section
    if (sectionId === 'guru') {
        if (!isQrScannerRunning) {
            startQrScanner();
        }
    } else { // Jika beralih ke siswa section
        if (isQrScannerRunning) {
            stopQrScanner();
        }
    }
}

// --- FUNGSI UNTUK BAGIAN SISWA (QR CODE GENERATOR) ---
function generateQRCode() {
    const nama = document.getElementById('namaSiswa').value.trim();
    const kelas = document.getElementById('kelasSiswa').value.trim();
    const jurusan = document.getElementById('jurusanSiswa').value.trim();

    if (!nama || !kelas) {
        alert('Nama dan Kelas harus diisi!');
        return;
    }

    const dataSiswa = {
        nama: nama,
        kelas: kelas,
        jurusan: jurusan || '-' // Jika jurusan kosong, isi dengan '-'
    };

    const dataString = JSON.stringify(dataSiswa);

    const qrcodeContainer = document.getElementById('qrcode');
    qrcodeContainer.innerHTML = ''; // Bersihkan QR sebelumnya

    new QRCode(qrcodeContainer, {
        text: dataString,
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    alert('QR Code berhasil dibuat! Silakan screenshot atau cetak.');
}

// --- FUNGSI UNTUK BAGIAN GURU (QR CODE SCANNER & PELANGGARAN) ---
function startQrScanner() {
    const qrCodeRegionId = "qr-reader";
    if (html5QrCode) { // Pastikan scanner sebelumnya sudah berhenti
        html5QrCode.stop().catch(err => console.warn("Error stopping old scanner:", err));
    }
    html5QrCode = new Html5Qrcode(qrCodeRegionId);
    isQrScannerRunning = true; // Set status running

    document.getElementById('qr-reader-results').innerText = 'Mencari kamera...';
    document.getElementById('qr-reader').style.display = 'block'; // Pastikan container terlihat

    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            // Pilih kamera belakang jika ada, atau kamera pertama
            const cameraId = devices.find(device => device.label.toLowerCase().includes('back'))?.id || devices[0].id;
            
            html5QrCode.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText, decodedResult) => {
                    // Berhasil scan!
                    console.log(`Code matched = ${decodedText}`, decodedResult);
                    try {
                        const studentData = JSON.parse(decodedText);
                        document.getElementById('scannedNama').innerText = studentData.nama;
                        document.getElementById('scannedKelas').innerText = studentData.kelas;
                        document.getElementById('scannedJurusan').innerText = studentData.jurusan;
                        document.getElementById('qr-reader-results').innerText = `QR Code berhasil dipindai! Siswa: ${studentData.nama}`;
                        document.getElementById('pelanggaran-form').style.display = 'block';
                        currentScannedStudent = studentData; // Simpan data siswa

                        // Stop scanner setelah berhasil scan
                        stopQrScanner();
                    } catch (e) {
                        document.getElementById('qr-reader-results').innerText = 'Data QR tidak valid!';
                        console.error('Error parsing QR data:', e);
                    }
                },
                (errorMessage) => {
                    // Error atau belum ada QR, abaikan pesan warning ini di console
                    // console.warn(`QR Code no match = ${errorMessage}`);
                }
            ).catch((err) => {
                console.error(`Unable to start scanning, please grant camera access.`, err);
                document.getElementById('qr-reader-results').innerText = 'Gagal memulai kamera. Pastikan memberikan izin akses kamera dan tidak ada aplikasi lain yang menggunakan kamera.';
                isQrScannerRunning = false;
            });
        } else {
            alert('Tidak ada kamera yang ditemukan di perangkat Anda.');
            document.getElementById('qr-reader-results').innerText = 'Tidak ada kamera yang ditemukan.';
            isQrScannerRunning = false;
        }
    }).catch(err => {
        console.error('Error getting cameras:', err);
        document.getElementById('qr-reader-results').innerText = 'Gagal mengakses kamera. Periksa izin browser.';
        isQrScannerRunning = false;
    });
}

function stopQrScanner() {
    if (html5QrCode && isQrScannerRunning) {
        html5QrCode.stop().then(() => {
            console.log("QR Code scanning stopped.");
            isQrScannerRunning = false;
            // Opsional: sembunyikan area scanner atau tampilkan placeholder
            // document.getElementById('qr-reader').style.display = 'none';
        }).catch((err) => {
            console.error("Failed to stop scanning.", err);
        });
    }
}

// --- FUNGSI MENYIMPAN DATA PELANGGARAN ---
let pelanggaranData = JSON.parse(localStorage.getItem('pelanggaranData')) || []; // Load dari LocalStorage

function recordPelanggaran() {
    if (!currentScannedStudent) {
        alert('Silakan scan QR siswa terlebih dahulu!');
        return;
    }

    const selectedPelanggaran = [];
    document.querySelectorAll('input[name="pelanggaran"]:checked').forEach(checkbox => {
        selectedPelanggaran.push(checkbox.value);
    });

    if (selectedPelanggaran.length === 0) {
        alert('Pilih setidaknya satu jenis pelanggaran!');
        return;
    }

    const newRecord = {
        nama: currentScannedStudent.nama,
        kelas: currentScannedStudent.kelas,
        jurusan: currentScannedStudent.jurusan,
        pelanggaran: selectedPelanggaran.join(', '), // Gabungkan jadi satu string
        waktu: new Date().toLocaleString() // Waktu saat ini
    };

    pelanggaranData.push(newRecord);
    localStorage.setItem('pelanggaranData', JSON.stringify(pelanggaranData)); // Simpan ke LocalStorage

    renderPelanggaranList(); // Perbarui tampilan daftar
    resetPelanggaranForm(); // Reset form setelah simpan
    alert('Pelanggaran berhasil dicatat!');
}

function renderPelanggaranList() {
    const tableBody = document.querySelector('#pelanggaran-list tbody');
    tableBody.innerHTML = ''; // Bersihkan tabel

    const noDataMessage = document.getElementById('no-data-message');
    if (pelanggaranData.length === 0) {
        noDataMessage.style.display = 'block';
    } else {
        noDataMessage.style.display = 'none';
    }

    pelanggaranData.forEach(record => {
        const row = tableBody.insertRow();
        row.insertCell().innerText = record.nama;
        row.insertCell().innerText = record.kelas;
        row.insertCell().innerText = record.jurusan;
        row.insertCell().innerText = record.pelanggaran;
        row.insertCell().innerText = record.waktu;
    });
}

function resetPelanggaranForm() {
    document.getElementById('scannedNama').innerText = '';
    document.getElementById('scannedKelas').innerText = '';
    document.getElementById('scannedJurusan').innerText = '';
    document.getElementById('qr-reader-results').innerText = '';
    document.getElementById('pelanggaran-form').style.display = 'none';
    document.querySelectorAll('input[name="pelanggaran"]:checked').forEach(checkbox => {
        checkbox.checked = false;
    });
    currentScannedStudent = null;
    startQrScanner(); // Mulai lagi scanner untuk scan berikutnya
}

// --- FUNGSI EKSPOR KE SPREADSHEET (CSV) ---
function exportToSpreadsheet() {
    if (pelanggaranData.length === 0) {
        alert('Tidak ada data pelanggaran untuk diekspor!');
        return;
    }

    const headers = ["Nama", "Kelas", "Jurusan", "Pelanggaran", "Waktu"];
    const csvRows = [];

    // Tambahkan header
    csvRows.push(headers.map(h => `"${h}"`).join(',')); // Enclose headers in quotes too

    // Tambahkan data
    pelanggaranData.forEach(record => {
        const values = [
            `"${record.nama.replace(/"/g, '""')}"`, // Handle double quotes by escaping them
            `"${record.kelas.replace(/"/g, '""')}"`,
            `"${record.jurusan.replace(/"/g, '""')}"`,
            `"${record.pelanggaran.replace(/"/g, '""')}"`,
            `"${record.waktu.replace(/"/g, '""')}"`
        ];
        csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'data_pelanggaran_siswa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Data berhasil diekspor ke file CSV!');
}


// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    renderPelanggaranList(); // Muat data yang sudah ada saat halaman dimuat
    showSection('siswa'); // Tampilkan bagian siswa secara default
});

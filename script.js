let currentSection = 'siswa'; // Default section

// --- FUNGSI NAVIGASI ---
function showSection(sectionId) {
    document.getElementById('siswa-section').style.display = 'none';
    document.getElementById('guru-section').style.display = 'none';

    document.getElementById(sectionId + '-section').style.display = 'block';
    currentSection = sectionId;

    // Reset QR scanner if switching from guru section
    if (sectionId === 'guru' && !html5QrCode) {
        startQrScanner();
    } else if (sectionId === 'siswa' && html5QrCode) {
        stopQrScanner();
    }
}

// --- FUNGSI UNTUK BAGIAN SISWA (QR CODE GENERATOR) ---
function generateQRCode() {
    const nama = document.getElementById('namaSiswa').value;
    const kelas = document.getElementById('kelasSiswa').value;
    const jurusan = document.getElementById('jurusanSiswa').value;

    if (!nama || !kelas) {
        alert('Nama dan Kelas harus diisi!');
        return;
    }

    const dataSiswa = {
        nama: nama,
        kelas: kelas,
        jurusan: jurusan || '-' // Jika jurusan kosong, isi dengan '-'
    };

    const dataString = JSON.stringify(dataSiswa); // Ubah objek jadi string JSON

    const qrcodeContainer = document.getElementById('qrcode');
    qrcodeContainer.innerHTML = ''; // Bersihkan QR sebelumnya

    // Buat QR Code
    new QRCode(qrcodeContainer, {
        text: dataString,
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    // Opsional: tampilkan pesan sukses
    alert('QR Code berhasil dibuat! Silakan screenshot atau cetak.');
}

// --- FUNGSI UNTUK BAGIAN GURU (QR CODE SCANNER & PELANGGARAN) ---
let html5QrCode;
let currentScannedStudent = null; // Untuk menyimpan data siswa yang sedang discan

function startQrScanner() {
    const qrCodeRegionId = "qr-reader";
    html5QrCode = new Html5Qrcode(qrCodeRegionId);

    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            var cameraId = devices[0].id; // Ambil kamera depan/pertama
            html5QrCode.start(
                cameraId,
                { fps: 10, qrbox: { width: 250, height: 250 } },
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
                        stopQrScanner(); // Hentikan scanner setelah berhasil scan
                    } catch (e) {
                        document.getElementById('qr-reader-results').innerText = 'Data QR tidak valid!';
                        console.error('Error parsing QR data:', e);
                    }
                },
                (errorMessage) => {
                    // Error atau belum ada QR
                    // console.warn(`QR Code no match = ${errorMessage}`);
                }
            ).catch((err) => {
                console.error(`Unable to start scanning, please grant camera access.`, err);
                document.getElementById('qr-reader-results').innerText = 'Gagal memulai kamera. Pastikan memberikan izin akses kamera.';
            });
        } else {
            alert('Tidak ada kamera yang ditemukan di perangkat Anda.');
            document.getElementById('qr-reader-results').innerText = 'Tidak ada kamera yang ditemukan.';
        }
    }).catch(err => {
        console.error('Error getting cameras:', err);
        document.getElementById('qr-reader-results').innerText = 'Gagal mengakses kamera. Periksa izin browser.';
    });
}

function stopQrScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then((ignore) => {
            console.log("QR Code scanning stopped.");
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

    if (pelanggaranData.length === 0) {
        document.getElementById('no-data-message').style.display = 'block';
        return;
    } else {
        document.getElementById('no-data-message').style.display = 'none';
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
    csvRows.push(headers.join(','));

    // Tambahkan data
    pelanggaranData.forEach(record => {
        const values = [
            `"${record.nama.replace(/"/g, '""')}"`, // Handle commas in names
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


// --- INITAL LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    renderPelanggaranList(); // Muat data yang sudah ada saat halaman dimuat
    showSection('siswa'); // Tampilkan bagian siswa secara default
});
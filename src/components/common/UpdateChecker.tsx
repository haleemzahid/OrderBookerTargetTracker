import { useState, useEffect } from 'react';
import { Button, Modal, Progress, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

interface UpdateCheckerProps {
  onUpdateAvailable?: (update: Update) => void;
  autoCheck?: boolean;
  checkInterval?: number; // in milliseconds
}

export const UpdateChecker: React.FC<UpdateCheckerProps> = ({
  onUpdateAvailable,
  autoCheck = true,
  checkInterval = 30 * 60 * 1000, // 30 minutes
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<Update | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const checkForUpdates = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const update = await check();
      if (update) {
        setUpdateAvailable(update);
        setIsModalVisible(true);
        onUpdateAvailable?.(update);
        message.info(`New version ${update.version} is available!`);
      } else {
        message.success('You are using the latest version');
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      message.error('Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  const downloadAndInstall = async () => {
    if (!updateAvailable) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    let downloaded = 0;
    let contentLength = 0;

    try {
      await updateAvailable.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            message.info('Download started...');
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            const progress = contentLength > 0 ? Math.round((downloaded / contentLength) * 100) : 0;
            setDownloadProgress(progress);
            break;
          case 'Finished':
            message.success('Update downloaded successfully!');
            break;
        }
      });

      message.success('Update installed! Restarting application...');
      await relaunch();
    } catch (error) {
      console.error('Failed to download and install update:', error);
      message.error('Failed to download and install update');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (autoCheck) {
      // Check immediately on mount
      checkForUpdates();

      // Set up interval for periodic checks
      const interval = setInterval(checkForUpdates, checkInterval);
      return () => clearInterval(interval);
    }
  }, [autoCheck, checkInterval]);

  return (
    <>
      <Button
        icon={<ReloadOutlined />}
        onClick={checkForUpdates}
        loading={isChecking}
        type="text"
        size="small"
      >
        Check for Updates
      </Button>

      <Modal
        title="Update Available"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Later
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            loading={isDownloading}
            onClick={downloadAndInstall}
          >
            Download & Install
          </Button>,
        ]}
      >
        {updateAvailable && (
          <div>
            <p><strong>New Version:</strong> {updateAvailable.version}</p>
            <p><strong>Release Date:</strong> {updateAvailable.date}</p>
            <p><strong>Release Notes:</strong></p>
            <div style={{ maxHeight: 200, overflow: 'auto', marginBottom: 16 }}>
              {updateAvailable.body}
            </div>
            {isDownloading && (
              <Progress
                percent={downloadProgress}
                status="active"
                format={(percent) => `${percent}%`}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

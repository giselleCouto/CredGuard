import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

const isProduction = process.env.NODE_ENV === 'production';
const isAWS = Boolean(process.env.AWS_REGION);

export function addCloudWatchTransport(logger: winston.Logger) {
  if (!isProduction || !isAWS) {
    console.log('[CloudWatch] Skipping (not in AWS production)');
    return;
  }

  const logGroupName = process.env.CLOUDWATCH_LOG_GROUP || '/aws/ecs/credguard';
  const logStreamName = `${process.env.HOSTNAME || 'local'}-${Date.now()}`;

  try {
    logger.add(new WinstonCloudWatch({
      logGroupName,
      logStreamName,
      awsRegion: process.env.AWS_REGION,
      jsonMessage: true,
      uploadRate: 2000,
    }));

    console.log(`[CloudWatch] Transport added: ${logGroupName}/${logStreamName}`);
  } catch (error) {
    console.error('[CloudWatch] Failed:', error);
  }
}
